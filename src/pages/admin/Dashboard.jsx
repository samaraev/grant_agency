import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { STATUS_KEYS, normalizeStatus, reachedQualified } from '@/lib/leadStatus';
import { slaList } from '@/lib/sla';
import TasksWidget from '@/components/admin/dashboard/TasksWidget';

function Metric({ label, value, hint, tone }) {
  return (
    <div className="border border-white/10 bg-[#263033] p-5">
      <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{label}</div>
      <div className={`mt-2 text-[30px] font-bold leading-none ${tone || 'text-white'}`}>{value}</div>
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
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Lead.list({ sort: '-created_date', limit: 300 }).catch(() => ({ items: [] })),
      base44.entities.AdminSettings.list({ limit: 1 }).catch(() => ({ items: [] })),
      base44.entities.Task.filter({ status: 'open' }, { sort: 'due_at', limit: 200 }).catch(() => ({ items: [] })),
      base44.auth.me().catch(() => null),
    ])
      .then(([leadPage, settingsPage, taskPage, me]) => {
        setLeads(leadPage?.items || []);
        setSettings(settingsPage?.items?.[0] || {});
        setTasks(taskPage?.items || []);
        setUser(me);
      })
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
    const funnel = Object.fromEntries(STATUS_KEYS.map((key) => [key, byStatus(key)]));
    const open = leads.filter(
      (lead) => !['non_target', 'deal_closed'].includes(normalizeStatus(lead.status))
    );
    return {
      total: leads.length,
      week: week.length,
      owners,
      buyers,
      khamovniki: leads.filter((lead) => lead.cluster === 'khamovniki').length,
      meaningful: leads.filter((lead) => reachedQualified(lead.status)).length,
      overdue: slaList(open, settings).length,
      byType,
      bySource,
      funnel,
    };
  }, [leads, settings]);

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
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Metric label={t.admin.dashboard.weekLeads} value={stats.week} />
            <Metric label={t.admin.dashboard.totalLeads} value={stats.total} />
            <Metric label={t.admin.dashboard.owners} value={stats.owners} />
            <Metric label={t.admin.dashboard.buyers} value={stats.buyers} />
            <Metric label={t.admin.dashboard.khamovniki} value={stats.khamovniki} />
            <Metric
              label={t.admin.dashboard.slaOverdue}
              value={stats.overdue}
              hint={t.admin.dashboard.slaOverdueHint}
              tone={stats.overdue > 0 ? 'text-[#ff8a96]' : 'text-white'}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Metric
              label={t.admin.dashboard.meaningful}
              value={`${stats.meaningful} / ${stats.total}`}
              hint={t.admin.dashboard.meaningfulHint}
            />
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
          </div>

          <div className="mt-4 border border-white/10 bg-[#263033] p-5">
            <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
              {t.admin.dashboard.funnel}
            </div>
            <div className="mt-3 gap-x-8 sm:columns-2">
              {STATUS_KEYS.map((key) => (
                <BarRow
                  key={key}
                  label={t.admin.leads.statuses[key]}
                  value={stats.funnel[key]}
                  max={funnelMax}
                />
              ))}
            </div>
          </div>

          <TasksWidget tasks={tasks} userEmail={user?.email || ''} />

          <div className="mt-4 border border-white/10 bg-[#263033] p-5">
            <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
              {t.admin.dashboard.bySource}
            </div>
            <div className="mt-3">
              {Object.keys(stats.bySource).length ? (
                Object.entries(stats.bySource)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([key, value]) => (
                    <BarRow key={key} label={key} value={value} max={maxSource} />
                  ))
              ) : (
                <p className="text-[13px] text-[#8f9a9f]">{t.admin.dashboard.noData}</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}