import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { LEGACY_MIGRATION, STATUS_KEYS } from '../../shared/leadFunnel.ts';

/**
 * Переносит старые статусы обращений на новую воронку.
 * По умолчанию работает как dry-run и только возвращает отчёт.
 * payload: { apply: boolean, promote_ids: string[] }
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const apply = body.apply === true;
    const promoteIds = Array.isArray(body.promote_ids) ? body.promote_ids.filter(Boolean) : [];

    const page = await base44.asServiceRole.entities.Lead.filter({}, { limit: 500 });
    const leads = page?.items || [];

    const counts = {};
    const legacy = [];
    const meaningful = [];
    const untouched = [];

    leads.forEach((lead) => {
      const mapping = LEGACY_MIGRATION[lead.status];
      if (mapping) {
        counts[lead.status] = (counts[lead.status] || 0) + 1;
        legacy.push({
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          address_text: lead.address_text || '',
          from: lead.status,
          to: mapping.to,
          rejection_reason: mapping.rejection_reason || '',
          tags: mapping.tags || [],
        });
      } else if (!STATUS_KEYS.includes(lead.status)) {
        untouched.push({ id: lead.id, name: lead.name, status: lead.status });
      }
      if (lead.is_meaningful) {
        meaningful.push({
          id: lead.id,
          name: lead.name,
          status: lead.status,
          address_text: lead.address_text || '',
          sell_timeline: lead.sell_timeline || '',
        });
      }
    });

    const report = {
      dry_run: !apply,
      total: leads.length,
      has_more: Boolean(page?.has_more),
      counts,
      legacy,
      meaningful,
      untouched,
      promoted: 0,
      updated: 0,
      history_written: 0,
    };

    if (!apply) return Response.json(report);

    const now = new Date().toISOString();
    const patches = [];
    const history = [];

    leads.forEach((lead) => {
      const mapping = LEGACY_MIGRATION[lead.status];
      if (!mapping) return;
      const patch = { ...lead, status: mapping.to };
      delete patch.id;
      Object.keys(patch).forEach((key) => {
        if (patch[key] === undefined) delete patch[key];
      });
      if (mapping.rejection_reason) patch.rejection_reason = mapping.rejection_reason;
      if (mapping.tags) {
        patch.tags = Array.from(new Set([...(lead.tags || []), ...mapping.tags]));
      }
      if (mapping.to === 'contract_signed') {
        patch.contract_type = ['agency', 'exclusive'].includes(lead.agreement) ? lead.agreement : undefined;
      }
      if (mapping.to === 'qualified_conversation') patch.qualified_at = lead.qualified_at || now;

      patches.push({ id: lead.id, ...patch });
      history.push({
        lead_id: lead.id,
        from_status: lead.status,
        to_status: mapping.to,
        changed_by: user.email,
        note: 'Миграция статусов',
      });
    });

    promoteIds.forEach((id) => {
      const lead = leads.find((item) => item.id === id);
      if (!lead || !lead.is_meaningful || lead.status === 'qualified_conversation') return;
      const index = patches.findIndex((item) => item.id === id);
      const patch = {
        ...(index >= 0 ? patches[index] : { id, ...lead }),
        id,
        status: 'qualified_conversation',
        qualified_at: lead.qualified_at || now,
      };
      delete patch.is_meaningful;
      if (index >= 0) patches[index] = patch;
      else patches.push(patch);
      history.push({
        lead_id: id,
        from_status: lead.status,
        to_status: 'qualified_conversation',
        changed_by: user.email,
        note: 'Перенос устаревшего флага is_meaningful',
      });
    });

    if (patches.length) {
      for (let i = 0; i < patches.length; i += 100) {
        await base44.asServiceRole.entities.Lead.bulkUpdate(patches.slice(i, i + 100));
      }
    }
    if (history.length) {
      for (let i = 0; i < history.length; i += 100) {
        await base44.asServiceRole.entities.StatusHistory.bulkCreate(history.slice(i, i + 100));
      }
    }

    report.updated = patches.length;
    report.promoted = promoteIds.length ? history.length - legacy.length : 0;
    report.history_written = history.length;
    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}