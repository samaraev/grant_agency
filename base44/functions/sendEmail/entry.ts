import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { mergeTemplate } from '../../shared/comms.ts';

function text(value, max = 2000) {
  return String(value === undefined || value === null ? '' : value).trim().slice(0, max);
}

/** Письмо клиенту из карточки обращения: шаблон, подстановки, запись в коммуникации. */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    // ВРЕМЕННО (демо): работаем и без входа. Для продакшена вернуть обязательную авторизацию.
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const actorEmail = user?.email || 'demo@showcase';

    const body = await req.json().catch(() => ({}));
    const leadId = text(body.lead_id, 100);
    if (!leadId) return Response.json({ error: 'lead_id is required' }, { status: 400 });

    const lead = await base44.asServiceRole.entities.Lead.get(leadId).catch((e) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!lead) return Response.json({ error: 'Обращение не найдено' }, { status: 404 });
    if (!lead.email) return Response.json({ error: 'У клиента не указана почта' }, { status: 400 });

    let subject = text(body.subject, 250);
    let message = text(body.body, 8000);

    if (body.template_id) {
      const template = await base44.asServiceRole.entities.MessageTemplate.get(text(body.template_id, 100)).catch(
        () => null
      );
      if (template) {
        subject = subject || text(template.subject, 250);
        message = message || text(template.body, 8000);
      }
    }

    subject = mergeTemplate(subject, lead) || 'Сообщение от агентства';
    message = mergeTemplate(message, lead);
    if (!message) return Response.json({ error: 'Пустое письмо' }, { status: 400 });

    const settingsPage = await base44.asServiceRole.entities.AdminSettings.list({ limit: 1 }).catch(() => null);
    const settings = settingsPage?.items?.[0] || {};

    let ok = true;
    let failure = '';
    let providerId = '';
    try {
      const result = await base44.asServiceRole.integrations.Core.SendEmail({
        to: lead.email,
        subject,
        body: message,
        from_name: text(settings.email_from_name, 120) || undefined,
        category: 'transactional',
      });
      providerId = String(result?.message_id || result?.id || '');
      if (result && result.success === false) {
        ok = false;
        failure = result.message || result.reason || 'send_failed';
      }
    } catch (error) {
      ok = false;
      failure = error.message;
    }

    const communication = await base44.asServiceRole.entities.Communication.create({
      lead_id: leadId,
      channel: 'email',
      direction: 'out',
      subject,
      body: message,
      status: ok ? 'sent' : 'failed',
      provider_id: providerId,
      created_by: actorEmail,
    });

    return Response.json({ ok, error: failure, communication });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}