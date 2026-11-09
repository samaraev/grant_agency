import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { PIPELINE_KEYS, inferPipeline } from '../../shared/leadFunnel.ts';
import { requireAdminOrDemo } from '../../shared/guards.ts';

/**
 * Проставляет Lead.pipeline существующим обращениям по типу (inferPipeline).
 * По умолчанию dry-run: только отчёт, без записи.
 * payload: { apply: boolean }
 * Заполняет только пустой pipeline; расхождения с ручной правкой попадают в отчёт и не перезаписываются.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const denied = await requireAdminOrDemo(base44);
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    const apply = body.apply === true;

    const page = await base44.asServiceRole.entities.Lead.filter({}, { limit: 500 });
    const leads = page?.items || [];

    const byPipeline = {};
    const byType = {};
    const missing = [];
    const mismatched = [];
    const patches = [];

    leads.forEach((lead) => {
      const type = lead.type || 'undefined';
      const target = inferPipeline(lead.type);
      byType[type] = (byType[type] || 0) + 1;
      byPipeline[target] = (byPipeline[target] || 0) + 1;

      const stored = PIPELINE_KEYS.includes(lead.pipeline) ? lead.pipeline : null;
      if (!stored) {
        missing.push({ id: lead.id, name: lead.name || '', type: lead.type || '', to: target });
        patches.push({ id: lead.id, pipeline: target });
      } else if (stored !== target) {
        mismatched.push({
          id: lead.id,
          name: lead.name || '',
          type: lead.type || '',
          from: stored,
          to: target,
        });
      }
    });

    const report = {
      dry_run: !apply,
      total: leads.length,
      has_more: Boolean(page?.has_more),
      by_type: byType,
      by_pipeline: byPipeline,
      missing_count: missing.length,
      missing: missing.slice(0, 20),
      mismatched_count: mismatched.length,
      mismatched: mismatched.slice(0, 20),
      updated: 0,
    };

    if (!apply) return Response.json(report);

    for (let i = 0; i < patches.length; i += 100) {
      await base44.asServiceRole.entities.Lead.bulkUpdate(patches.slice(i, i + 100));
    }

    report.updated = patches.length;
    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}