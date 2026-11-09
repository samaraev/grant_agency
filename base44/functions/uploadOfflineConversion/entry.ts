import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { requireAdminOrDemo } from '../../shared/guards.ts';
import { OFFLINE_GOAL_KEYS, sendOfflineConversion } from '../../shared/metrica.ts';

function text(value, max = 200) {
  return String(value === undefined || value === null ? '' : value).trim().slice(0, max);
}

/**
 * Офлайн-конверсия в Яндекс.Метрику по ClientID обращения.
 * Никогда не блокирует смену статуса: возвращает причину отказа.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const denied = await requireAdminOrDemo(base44);
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    const leadId = text(body.lead_id, 100);
    const goalKey = text(body.goal_key, 60);

    if (!leadId) return Response.json({ ok: false, reason: 'lead_id_required' }, { status: 400 });
    if (!OFFLINE_GOAL_KEYS.includes(goalKey)) {
      return Response.json({ ok: false, reason: 'unknown_goal' }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Lead.get(leadId).catch((e) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!lead) return Response.json({ ok: false, reason: 'lead_not_found' }, { status: 404 });

    const user = await base44.auth.me().catch(() => null);
    const result = await sendOfflineConversion(base44, {
      lead,
      goalKey,
      actor: user?.email || 'demo',
    });

    return Response.json(result, { status: result.ok ? 200 : 200 });
  } catch (error) {
    return Response.json({ ok: false, reason: 'error', detail: error.message }, { status: 500 });
  }
}