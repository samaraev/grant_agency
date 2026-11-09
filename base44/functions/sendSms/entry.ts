import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { mergeTemplate, sendSmsVia, smsConfigured } from '../../shared/comms.ts';

function text(value, max = 2000) {
  return String(value === undefined || value === null ? '' : value).trim().slice(0, max);
}

/** SMS клиенту: маркетинговые тексты только при наличии согласия. */
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
    if (!leadId) return Response.json({ error: 'lead_id is required' }, { status: 400 });

    const lead = await base44.asServiceRole.entities.Lead.get(leadId).catch((e) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!lead) return Response.json({ error: 'Обращение не найдено' }, { status: 404 });
    if (!lead.phone) return Response.json({ error: 'У клиента нет телефона' }, { status: 400 });

    const marketing = body.marketing === true;
    if (marketing && !lead.consent_at) {
      return Response.json(
        { error: 'Нет согласия на обработку данных: маркетинговые SMS запрещены. Ответ на обращение отправить можно.' },
        { status: 400 }
      );
    }

    let message = text(body.body, 1000);
    if (!message && body.template_id) {
      const template = await base44.asServiceRole.entities.MessageTemplate.get(text(body.template_id, 100)).catch(
        () => null
      );
      message = text(template?.body, 1000);
    }
    message = mergeTemplate(message, lead);
    if (!message) return Response.json({ error: 'Пустой текст SMS' }, { status: 400 });

    const settingsPage = await base44.asServiceRole.entities.AdminSettings.list({ limit: 1 }).catch(() => null);
    const settings = settingsPage?.items?.[0] || {};
    const provider = text(settings.sms_provider, 40) || 'none';

    if (!smsConfigured(provider)) {
      return Response.json({
        ok: false,
        configured: false,
        error: 'Провайдер SMS не настроен',
        provider,
      });
    }

    const result = await sendSmsVia(provider, lead.phone, message, text(settings.sms_sender, 60));
    const communication = await base44.asServiceRole.entities.Communication.create({
      lead_id: leadId,
      channel: 'sms',
      direction: 'out',
      body: message,
      status: result.ok ? 'sent' : 'failed',
      provider_id: result.provider_id || '',
      created_by: actorEmail,
    });

    return Response.json({
      ok: result.ok,
      configured: true,
      provider,
      error: result.error || '',
      communication,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}