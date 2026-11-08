import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { readSecret } from '../../shared/comms.ts';

const STATUS_MAP = {
  delivered: 'delivered',
  sent: 'sent',
  answered: 'answered',
  completed: 'answered',
  call_finished: 'answered',
  missed: 'missed',
  no_answer: 'missed',
  failed: 'failed',
  undelivered: 'failed',
  error: 'failed',
};

/** Приёмник статусов доставки и событий звонков. Защищён секретным токеном. */
export default async function (req) {
  try {
    const expected = readSecret('COMMS_WEBHOOK_TOKEN');
    if (!expected) {
      return Response.json({ error: 'Вебхук не настроен: нет токена' }, { status: 503 });
    }

    const url = new URL(req.url);
    const token = url.searchParams.get('token') || req.headers.get('x-webhook-token') || '';
    if (token !== expected) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const providerId = String(body.provider_id || body.id || body.call_id || body.sms_id || '')
      .trim()
      .slice(0, 160);
    if (!providerId) return Response.json({ error: 'provider_id is required' }, { status: 400 });

    const status = STATUS_MAP[String(body.status || body.event || '').toLowerCase()] || '';
    const patch = {};
    if (status) patch.status = status;
    if (body.duration_seconds) patch.duration_seconds = Number(body.duration_seconds) || 0;
    if (body.duration) patch.duration_seconds = Number(body.duration) || 0;
    if (body.recording_url) patch.recording_url = String(body.recording_url).slice(0, 500);

    if (!Object.keys(patch).length) {
      return Response.json({ ok: true, updated: 0 });
    }

    const base44 = createClientFromRequest(req);
    const page = await base44.asServiceRole.entities.Communication.filter(
      { provider_id: providerId },
      { limit: 5 }
    );
    const items = page?.items || [];
    for (const item of items) {
      await base44.asServiceRole.entities.Communication.update(item.id, patch);
    }

    return Response.json({ ok: true, updated: items.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}