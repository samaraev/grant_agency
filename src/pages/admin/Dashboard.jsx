import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { STATUS_KEYS, normalizeStatus, reachedQualified } from '@/lib/leadStatus';
import { slaList } from '@/lib/sla';
import { isDueToday, isOverdue, sortTasks } from '@/lib/tasks';
import ActionCenter from '@/components/admin/dashboard/ActionCenter';
import FunnelHealth from '@/components/admin/dashboard/FunnelHealth';
import DistributionCard from '@/components/admin/dashboard/DistributionCard';
import RecentLeads from '@/components/admin/dashboard/RecentLeads';

const SOURCE_LIMIT = 5;

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');

  useEffect(() => {
    Promise.all([
      base44.entities.Lead.list({ sort: '-created_date', limit: 300 }).catch(() => ({ items: [] })),
      base44.entities.AdminSettings.list({ limit: 1 }).catch(() => ({ items: [] })),
      base44.entities.Task.filter({ status: 'open' }, { sort: 'due_at', limit: 200 }).catch(() => ({ items: [] })),
    ])
      .then(([leadPage, settingsPage, taskPage]) => {
        setLeads(leadPage?.items || []);
        setSettings(settingsPage?.items?.[0] || {});
        setTasks(taskPage?.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
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
      owners,
      buyers,
      khamovniki: leads.filter((lead) => lead.cluster === 'khamovniki').length,
      meaningful: leads.filter((lead) => reachedQualified(lead.status)).length,
      overdue: slaList(open, settings).length,
      newLeads: funnel.new_inquiry,
      byType,
      bySource,
      funnel,
    };
  }, [leads, settings]);

  const taskStats = useMemo(() => {
    const open = tasks.filter((task) => task.status === 'open');
    const urgent = sortTasks(
      open.filter((task) => isOverdue(task) || isDueToday(task))
    ).slice(0, 3);
    return {
      today: open.filter(isDueToday).length,
      overdue: open.filter(isOverdue).length,
      urgent,
    };
  }, [tasks]);

  const typeRows = useMemo(
    () =>
      Object.entries(stats.byType)
        .map(([key, value]) => ({ label: t.lead.types[key] || key, value }))
        .sort((a, b) => b.value - a.value),
    [stats.byType]
  );

  const sourceRows = useMemo(() => {
    const sorted = Object.entries(stats.bySource).sort((a, b) => b[1] - a[1]);
    const head = sorted.slice(0, SOURCE_LIMIT).map(([label, value]) => ({ label, value }));
    const rest = sorted.slice(SOURCE_LIMIT);
    if (rest.length) {
      head.push({
        label: t.admin.dashboard.otherSources,
        value: rest.reduce((sum, [, value]) => sum + value, 0),
      });
    }
    return head;
  }, [stats.bySource]);

  const recent = useMemo(() => leads.slice(0, 5), [leads]);

  const markDone = async (task) => {
    setSavingId(task.id);
    await base44.entities.Task.update(task.id, { status: 'done' });
    setTasks((prev) => prev.filter((item) => item.id !== task.id));
    setSavingId('');
  };

  return (
    <div>
      <div className="eyebrow">{t.admin.marker}</div>
      <h1 className="mt-3 text-[26px] font-bold text-white">{t.admin.nav.dashboard}</h1>

      {loading ? (
        <div className="mt-8 h-32 animate-pulse border border-white/10 bg-[#263033]" />
      ) : (
        <div className="mt-8 space-y-6">
          <ActionCenter
            sla={stats.overdue}
            slaHint={t.admin.dashboard.slaOverdueHint}
            tasksToday={taskStats.today}
            tasksOverdue={taskStats.overdue}
            newLeads={stats.newLeads}
            urgent={taskStats.urgent}
            onDone={markDone}
            savingId={savingId}
          />

          <FunnelHealth
            funnel={stats.funnel}
            total={stats.total}
            khamovniki={stats.khamovniki}
            owners={stats.owners}
            buyers={stats.buyers}
            meaningful={stats.meaningful}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <DistributionCard title={t.admin.dashboard.byType} rows={typeRows} />
            <DistributionCard title={t.admin.dashboard.bySource} rows={sourceRows} />
          </div>

          <RecentLeads leads={recent} />
        </div>
      )}
    </div>
  );
}