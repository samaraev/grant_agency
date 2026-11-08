import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { callVia, telephonyConfigured } from '../../shared/comms.ts';

function text(value, max = 2000) {
  return String(value === undefined || value === null ? '' : value).trim().slice(0, max);
}

/** Click-to-call: провайдер звонит администратору, затем клиенту. */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const leadId = text(body.lead_id, 100);
    if (!leadId) return Response.json({ error: 'lead_id is required' }, { status: 400 });

    const lead = await base44.asServiceRole.entities.Lead.get(leadId).catch((e) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!lead) return Response.json({ error: 'Обращение не найдено' }, { status: 404 });

    const settingsPage = await base44.asServiceRole.entities.AdminSettings.list({ limit: 1 }).catch(() => null);
    const settings = settingsPage?.items?.[0] || {};
    const provider = text(settings.telephony_provider, 40) || 'none';

    if (!telephonyConfigured(provider)) {
      return Response.json({ ok: false, configured: false, error: 'Провайдер телефонии не настроен', provider });
    }

    const adminNumber = text(body.admin_number, 40) || text(settings.call_first_number, 40);
    const result = await callVia(provider, adminNumber, lead.phone);

    const communication = await base44.asServiceRole.entities.Communication.create({
      lead_id: leadId,
      channel: 'call',
      direction: 'out',
      body: result.ok ? 'Звонок через провайдера' : `Звонок не запущен: ${result.error}`,
      status: result.ok ? 'queued' : 'failed',
      provider_id: result.provider_id || '',
      created_by: user.email,
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