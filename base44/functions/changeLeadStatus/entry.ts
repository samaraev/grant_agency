import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { CHECKLIST_KEYS, STATUS_KEYS, inferPersonRole } from '../../shared/leadFunnel.ts';
import { autoSendForStatus } from '../../shared/sequences.ts';
import { OFFLINE_GOAL_KEYS, sendOfflineConversion } from '../../shared/metrica.ts';

const CONTRACT_TYPES = ['agency', 'exclusive'];
const PERSON_ROLES = ['owner', 'buyer', 'tenant', 'other'];
const AREA_FLAGS = ['in_target', 'outside', 'unknown'];
const TIMEFRAMES = ['asap', '1_3_months', '3_6_months', 'later', 'unknown'];
const INTENTS = ['low', 'medium', 'high'];

function text(value, max = 2000) {
  return String(value === undefined || value === null ? '' : value).trim().slice(0, max);
}

/**
 * Меняет статус обращения и проверяет правила воронки на сервере.
 * payload: { lead_id, status, payload: {...}, note }
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    // ВРЕМЕННО (демо): работаем и без входа — то же правило, что в base44/shared/guards.ts (requireAdminOrDemo).
    // TODO(demo-mode): при включении защиты /admin вернуть строгую проверку роли администратора.
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const actorEmail = user?.email || 'demo@showcase';

    const body = await req.json().catch(() => ({}));
    const leadId = text(body.lead_id, 100);
    const status = text(body.status, 60);
    const input = body.payload && typeof body.payload === 'object' ? body.payload : {};

    if (!leadId) return Response.json({ error: 'Не указано обращение' }, { status: 400 });
    if (!STATUS_KEYS.includes(status)) {
      return Response.json({ error: 'Неизвестный статус' }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Lead.get(leadId).catch((e) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!lead) return Response.json({ error: 'Обращение не найдено' }, { status: 404 });

    const patch = {};
    const suggestions = [];

    if (PERSON_ROLES.includes(input.person_role)) patch.person_role = input.person_role;
    if (AREA_FLAGS.includes(input.area_flag)) patch.area_flag = input.area_flag;
    if (TIMEFRAMES.includes(input.timeframe_hint)) patch.timeframe_hint = input.timeframe_hint;
    if (INTENTS.includes(input.intent_rating)) patch.intent_rating = input.intent_rating;
    if (input.next_action_date !== undefined) patch.next_action_date = text(input.next_action_date, 40);
    if (input.next_action_note !== undefined) patch.next_action_note = text(input.next_action_note, 500);
    if (input.meeting_result !== undefined) patch.meeting_result = text(input.meeting_result, 2000);
    if (input.responsible !== undefined) patch.responsible = text(input.responsible, 160);

    const effectiveRole = patch.person_role || lead.person_role || inferPersonRole(lead.type);
    const effectiveArea = patch.area_flag || lead.area_flag || 'unknown';
    const effectiveTimeframe = patch.timeframe_hint || lead.timeframe_hint || '';

    // Целевое обращение: понятна роль, объект или адрес, задача и принадлежность кластеру.
    if (status === 'target_inquiry') {
      const overrideReason = text(input.override_reason, 300);
      const problems = [];
      if (!PERSON_ROLES.includes(effectiveRole)) problems.push('роль человека');
      if (!lead.building_id && !text(lead.address_text)) problems.push('адрес или дом в базе');
      if (!text(lead.message) && !text(input.task_text)) problems.push('задача человека');
      if (effectiveArea !== 'in_target' && !overrideReason) {
        problems.push('объект в целевом кластере (или обоснованное исключение)');
      }
      if (problems.length) {
        return Response.json(
          { error: `Для целевого обращения не хватает: ${problems.join(', ')}` },
          { status: 400 }
        );
      }
      patch.person_role = effectiveRole;
      patch.area_flag = effectiveArea === 'unknown' ? 'in_target' : effectiveArea;
      if (overrideReason) {
        patch.admin_notes = [lead.admin_notes, `Исключение по кластеру: ${overrideReason}`]
          .filter(Boolean)
          .join('\n');
      }
    }

    // Квалифицированный разговор: весь чек-лист подтверждён, намерение зафиксировано.
    if (status === 'qualified_conversation') {
      const checklist = input.checklist && typeof input.checklist === 'object' ? input.checklist : {};
      const missing = CHECKLIST_KEYS.filter((key) => checklist[key] !== true);
      if (missing.length) {
        return Response.json(
          { error: 'Квалификация возможна только при всех подтверждённых пунктах чек-листа', missing },
          { status: 400 }
        );
      }
      if (!INTENTS.includes(patch.intent_rating)) {
        return Response.json({ error: 'Укажите оценку намерения' }, { status: 400 });
      }
      if (!effectiveTimeframe || effectiveTimeframe === 'unknown') {
        return Response.json({ error: 'Зафиксируйте ориентир по сроку' }, { status: 400 });
      }
      patch.qualified_at = new Date().toISOString();
      patch.timeframe_hint = effectiveTimeframe;
    }

    // Подписанный договор: тип договора и ссылка на файл.
    if (status === 'contract_signed') {
      const contractType = text(input.contract_type, 40);
      const contractUrl = text(input.contract_url, 500);
      if (!CONTRACT_TYPES.includes(contractType)) {
        return Response.json({ error: 'Укажите тип договора: агентский или эксклюзивный' }, { status: 400 });
      }
      if (!contractUrl) return Response.json({ error: 'Приложите ссылку на договор' }, { status: 400 });
      patch.contract_type = contractType;
      patch.contract_url = contractUrl;
      patch.agreement = contractType;
    }

    // Нецелевое обращение: причина строго из справочника.
    if (status === 'non_target') {
      const reason = text(input.rejection_reason, 300);
      if (!reason) return Response.json({ error: 'Укажите причину отказа' }, { status: 400 });
      const reasons = await base44.asServiceRole.entities.RejectionReason.list({ limit: 200 });
      const allowed = (reasons?.items || []).filter((item) => item.is_active !== false);
      if (!allowed.some((item) => item.label === reason)) {
        return Response.json({ error: 'Причина отказа должна быть из справочника' }, { status: 400 });
      }
      patch.rejection_reason = reason;
    }

    // Подсказки, которые администратор применяет сам.
    if (effectiveArea === 'outside' && status !== 'non_target') {
      suggestions.push({
        status: 'non_target',
        rejection_reason: 'объект или задача вне целевого кластера',
      });
    }
    const tags = Array.isArray(lead.tags) ? [...lead.tags] : [];
    if ((lead.type === 'rent' || effectiveRole === 'tenant') && !tags.includes('rent_low_priority')) {
      tags.push('rent_low_priority');
      patch.tags = tags;
    }

    patch.status = status;
    const updated = await base44.asServiceRole.entities.Lead.update(leadId, patch);
    await base44.asServiceRole.entities.StatusHistory.create({
      lead_id: leadId,
      from_status: lead.status || '',
      to_status: status,
      changed_by: actorEmail,
      note: text(body.note, 500),
    });

    // Офлайн-конверсия в Метрику: отправляем, не дожидаясь ответа, —
    // сбой Метрики не мешает смене статуса (причина уйдёт в журнал).
    if (OFFLINE_GOAL_KEYS.includes(status)) {
      sendOfflineConversion(base44, { lead: updated, goalKey: status, actor: actorEmail }).catch(
        () => null
      );
    }

    // Авто-отправка сценариев: сбой очереди не должен отменять смену статуса.
    let sequences = null;
    try {
      sequences = await autoSendForStatus(base44, { lead: updated, actor: actorEmail });
    } catch (error) {
      sequences = { error: error.message };
    }

    return Response.json({ ok: true, lead: updated, suggestions, sequences });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}