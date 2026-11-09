import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { requireAdminOrDemo } from '../../shared/guards.ts';
import { dispatchQueued } from '../../shared/sequences.ts';

/**
 * Отправляет созревшую очередь сообщений (status = queued, scheduled_at в прошлом).
 * Запускается воркфлоу SequenceDispatcher каждые 15 минут и кнопкой «Отправить отложенные».
 * Повторная отправка исключена: строка берётся только со status = queued и без sent_at.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const denied = await requireAdminOrDemo(base44);
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    const limit = Math.max(1, Math.min(200, Number(body?.limit) || 50));

    const result = await dispatchQueued(base44, { limit });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}