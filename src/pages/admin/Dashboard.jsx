import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { normalizeStatus, reachedQualified } from '@/lib/leadStatus';

function Metric({ label, value, hint }) {
  return (
    <div className="border border-white/10 bg-[#263033] p-5">
      <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{label}</div>
      <div className="mt-2 text-[30px] font-bold leading-none text-white">{value}</div>
      {hint ? <div className="mt-2 text-[11px] text-[#6f7a7f]">{hint}</div> : null}
    </div>
  );
}

function BarRow({ label, value, max }) {
  const width = max > 0 ? Math.max(3, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-[46%] truncate text-[12.5px] text-[#b0b8bc]">{label}</div>
      <div className="h-[6px] flex-1 bg-white/8">
        <div className="h-full bg-[#c8102e]" style={{ width: `${width}%` }} />
      </div>
      <div className="w-8 text-right text-[12px] text-white">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Lead.list({ sort: '-created_date', limit: 300 })
      .then((page) => setLeads(page?.items || []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const week = leads.filter((lead) => new Date(lead.created_date).getTime() >= weekAgo);
    const byType = {};
    const bySource = {};
    leads.forEach((lead) => {
      byType[lead.type] = (byType[lead.type] || 0) + 1;
      const source = lead.source || 'direct';
      bySource[source] = (bySource[source] || 0) + 1;
    });
    const owners = leads.filter((lead) => String(lead.type).startsWith('owner')).length;
    const buyers = leads.filter((lead) => String(lead.type).startsWith('buyer')).length;
    const byStatus = (status) =>
      leads.filter((lead) => normalizeStatus(lead.status) === status).length;
    const funnel = {
      new_inquiry: byStatus('new_inquiry'),
      contact_made: byStatus('contact_made'),
      target_inquiry: byStatus('target_inquiry'),
      qualified_conversation: byStatus('qualified_conversation'),
      meeting_scheduled:
        byStatus('meeting_scheduled') + byStatus('meeting_held'),
      contract_signed: byStatus('contract_signed') + byStatus('listed_or_search_started'),
      deal_closed: byStatus('deal_closed'),
      non_target: byStatus('non_target'),
    };
    return {
      total: leads.length,
      week: week.length,
      owners,
      buyers,
      khamovniki: leads.filter((lead) => lead.cluster === 'khamovniki').length,
      meaningful: leads.filter((lead) => reachedQualified(lead.status)).length,
      byType,
      bySource,
      funnel,
    };
  }, [leads]);

  const maxType = Math.max(1, ...Object.values(stats.byType));
  const maxSource = Math.max(1, ...Object.values(stats.bySource));
  const funnelMax = Math.max(1, ...Object.values(stats.funnel));

  return (
    <div>
      <div className="eyebrow">{t.admin.marker}</div>
      <h1 className="mt-3 text-[26px] font-bold text-white">{t.admin.nav.dashboard}</h1>

      {loading ? (
        <div className="mt-8 h-32 animate-pulse border border-white/10 bg-[#263033]" />
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Metric label={t.admin.dashboard.weekLeads} value={stats.week} />
            <Metric label={t.admin.dashboard.totalLeads} value={stats.total} />
            <Metric label={t.admin.dashboard.owners} value={stats.owners} />
            <Metric label={t.admin.dashboard.buyers} value={stats.buyers} />
            <Metric label={t.admin.dashboard.khamovniki} value={stats.khamovniki} />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Metric
              label={t.admin.dashboard.meaningful}
              value={`${stats.meaningful} / ${stats.total}`}
              hint={t.admin.dashboard.meaningfulHint}
            />
            <div className="border border-white/10 bg-[#263033] p-5">
              <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                {t.admin.dashboard.funnel}
              </div>
              <div className="mt-3">
                {Object.entries(stats.funnel).map(([key, value]) => (
                  <BarRow
                    key={key}
                    label={t.admin.dashboard.funnelStages[key]}
                    value={value}
                    max={funnelMax}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="border border-white/10 bg-[#263033] p-5">
              <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                {t.admin.dashboard.byType}
              </div>
              <div className="mt-3">
                {Object.keys(stats.byType).length ? (
                  Object.entries(stats.byType).map(([key, value]) => (
                    <BarRow key={key} label={t.lead.types[key] || key} value={value} max={maxType} />
                  ))
                ) : (
                  <p className="text-[13px] text-[#8f9a9f]">{t.admin.dashboard.noData}</p>
                )}
              </div>
            </div>
            <div className="border border-white/10 bg-[#263033] p-5">
              <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                {t.admin.dashboard.bySource}
              </div>
              <div className="mt-3">
                {Object.keys(stats.bySource).length ? (
                  Object.entries(stats.bySource)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([key, value]) => (
                      <BarRow key={key} label={key} value={value} max={maxSource} />
                    ))
                ) : (
                  <p className="text-[13px] text-[#8f9a9f]">{t.admin.dashboard.noData}</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}