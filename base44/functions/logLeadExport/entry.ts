import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { requireAdminOrDemo } from '../../shared/guards.ts';
import { currentActor, writeAudit } from '../../shared/audit.ts';

const MAX_COUNT = 100000;
const MAX_STR = 200;
const FILTER_KEYS = ['search', 'status', 'type', 'cluster', 'source', 'from'];

const clean = (value) => String(value ?? '').trim().slice(0, MAX_STR);

/**
 * Журналирует выгрузку журнала обращений в CSV.
 * Сама выгрузка остаётся на клиенте — функция только пишет строку в AuditLog.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const denied = await requireAdminOrDemo(base44);
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    const count = Math.max(0, Math.min(MAX_COUNT, Math.trunc(Number(body?.count) || 0)));

    const raw = body?.filters && typeof body.filters === 'object' ? body.filters : {};
    const filters = {};
    FILTER_KEYS.forEach((key) => {
      const value = clean(raw[key]);
      if (value) filters[key] = value;
    });

    await writeAudit(base44, {
      actor: await currentActor(base44),
      action: 'lead.exported',
      entity: 'Lead',
      meta: { count, filters },
    });

    return Response.json({ ok: true, count });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}