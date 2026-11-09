import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Layers, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import LeadsTable from '@/components/admin/leads/LeadsTable';
import LeadsKanban from '@/components/admin/leads/LeadsKanban';
import StatusTransitionDialog from '@/components/admin/leads/StatusTransitionDialog';
import LeadDetail from '@/pages/admin/LeadDetail';
import { downloadCsv, toCsv } from '@/lib/csv';
import { leadCommission } from '@/lib/deal';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { STATUS_KEYS, needsTransitionData, reachedQualified, statusQuery } from '@/lib/leadStatus';
import { pipelineForType } from '@/lib/pipeline';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [tasksByLead, setTasksByLead] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [cluster, setCluster] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [source, setSource] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [view, setView] = useState('table');
  const [showDealValue, setShowDealValue] = useState(false);
  const [selected, setSelected] = useState(null);
  const [transition, setTransition] = useState(null);
  const [qualified, setQualified] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const query = {};
    if (status) Object.assign(query, statusQuery(status));
    if (type) query.type = type;
    if (cluster) query.cluster = cluster;
    base44.entities.Lead.filter(query, {
      sort: sortDesc ? '-created_date' : 'created_date',
      limit: 300,
    })
      .then((page) => setLeads(page?.items || []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [status, type, cluster, sortDesc]);

  const loadKpi = useCallback(() => {
    base44.entities.Lead.aggregate({ groupBy: 'status' })
      .then((res) => {
        const total = (res?.rows || []).reduce(
          (acc, row) => acc + (reachedQualified(row.status) ? row.count || 0 : 0),
          0
        );
        setQualified(total);
      })
      .catch(() => setQualified(null));
  }, []);

  useEffect(load, [load]);
  useEffect(loadKpi, [loadKpi]);

  useEffect(() => {
    base44.entities.Task.filter({ status: 'open' }, { limit: 300 })
      .then((page) => {
        const counts = {};
        (page?.items || []).forEach((task) => {
          if (task.lead_id) counts[task.lead_id] = (counts[task.lead_id] || 0) + 1;
        });
        setTasksByLead(counts);
      })
      .catch(() => setTasksByLead({}));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (from && new Date(lead.created_date) < new Date(`${from}T00:00:00`)) return false;
      if (source && (lead.source || 'direct') !== source) return false;
      if (!query) return true;
      return `${lead.name || ''} ${lead.phone || ''} ${lead.address_text || ''}`
        .toLowerCase()
        .includes(query);
    });
  }, [leads, search, from, source]);

  const sources = useMemo(
    () => [...new Set(leads.map((lead) => lead.source || 'direct'))].sort(),
    [leads]
  );

  const replaceLead = (updated) => {
    if (!updated) return;
    setLeads((prev) => prev.map((lead) => (lead.id === updated.id ? updated : lead)));
    loadKpi();
  };

  const applyStatus = async (lead, nextStatus) => {
    setError('');
    try {
      const res = await base44.functions.invoke('changeLeadStatus', {
        lead_id: lead.id,
        status: nextStatus,
        payload: {},
        note: '',
      });
      replaceLead(res?.data?.lead);
      return true;
    } catch (err) {
      setError(err?.response?.data?.error || t.admin.leads.transition.error);
      return false;
    }
  };

  const onMove = (lead, nextStatus) => {
    if (needsTransitionData(lead, nextStatus)) {
      setTransition({ lead, status: nextStatus });
      return;
    }
    applyStatus(lead, nextStatus);
  };

  const exportCsv = async () => {
    const c = t.admin.leads.columns;
    const f = t.admin.leads.workspace.fields;
    const columns = [
      { key: 'created_date', label: c.created },
      { key: 'type', label: c.type },
      { key: 'person_role', label: c.personRole },
      { key: 'area_flag', label: c.area },
      { key: 'cluster', label: c.cluster },
      { key: 'intent_rating', label: c.intent },
      { key: 'timeframe_hint', label: c.timeframe },
      { key: 'name', label: c.name },
      { key: 'phone', label: c.phone },
      { key: 'email', label: f.email },
      { key: 'address_text', label: c.address },
      { key: 'status', label: c.status },
      { key: 'qualified_at', label: c.qualifiedAt },
      { key: 'agreement', label: c.agreement },
      { key: 'contract_type', label: f.contractType },
      { key: 'responsible', label: c.responsible },
      { key: 'next_action_date', label: c.nextAction },
      { key: 'next_action_note', label: f.nextActionNote },
      { key: 'source', label: c.source },
      { key: 'utm_source', label: 'utm_source' },
      { key: 'utm_medium', label: 'utm_medium' },
      { key: 'utm_campaign', label: 'utm_campaign' },
      { key: 'utm_term', label: 'utm_term' },
      { key: 'utm_content', label: 'utm_content' },
      { key: 'client_id', label: 'ClientID' },
      { key: 'page_path', label: f.pagePath },
      { key: 'is_meaningful', label: c.meaningful },
      { key: 'message', label: t.admin.leads.detail.message },
      { key: 'admin_notes', label: f.notes },
      { key: 'pipeline', label: t.admin.nav.pipeline },
      { key: 'deal_value', label: c.dealValue },
      { key: 'deal_currency', label: f.dealCurrency },
      { key: 'commission_percent', label: f.commissionPercent },
      { key: 'commission_amount', label: f.commission },
      { key: 'expected_close_date', label: f.expectedClose },
      { key: 'closed_at', label: f.closedAt },
    ];
    const rows = filtered.map((lead) => ({
      ...lead,
      is_meaningful: lead.is_meaningful ? f.yes : f.no,
      commission_amount: leadCommission(lead) ?? '',
    }));

    // Журналируем выгрузку до скачивания: lead.exported в AuditLog.
    await base44.functions.invoke('logLeadExport', {
      count: filtered.length,
      filters: { search, status, type, cluster, source, from },
    });

    downloadCsv('leads.csv', toCsv(rows, columns));
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">{t.admin.marker}</div>
          <h1 className="mt-3 text-[26px] font-bold text-white">{t.admin.leads.title}</h1>
          <p className="mt-2 text-[13px] text-[#8f9a9f]">{t.admin.leads.subtitle}</p>
          {qualified !== null ? (
            <p className="mt-2 text-[12.5px] text-[#c9b28c]">
              {t.admin.leads.kpi.qualified}: <span className="font-semibold text-white">{qualified}</span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex border border-white/15">
            {['table', 'kanban'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setView(key);
                  if (key === 'kanban') setStatus('');
                }}
                className={cn(
                  'min-h-[40px] px-3 text-[12.5px]',
                  view === key ? 'bg-[#c8102e] text-white' : 'text-[#9aa4a8] hover:text-white'
                )}
                aria-pressed={view === key}
              >
                {t.admin.leads.view[key]}
              </button>
            ))}
          </div>
          <Link
            to={`/admin/pipeline?pipeline=${pipelineForType(type)}`}
            className="flex min-h-[40px] items-center gap-2 border border-white/15 px-4 text-[12.5px] text-white hover:border-[#c9b28c]"
          >
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            {t.admin.pipeline.open}
          </Link>
          <button
            type="button"
            onClick={exportCsv}
            className="flex min-h-[40px] items-center gap-2 border border-white/15 px-4 text-[12.5px] text-white hover:border-[#c9b28c]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {t.admin.leads.export}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6f7a7f]" aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.admin.leads.search}
            className="h-[40px] w-full border border-white/10 bg-[#1f272b] pl-9 pr-3 text-[13px] text-white placeholder:text-[#6f7a7f] focus:border-[#c8102e] focus:outline-none"
          />
        </div>
        {view === 'table' ? (
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label={t.admin.leads.allStatuses}
            className="h-[40px] border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none"
          >
            <option value="">{t.admin.leads.allStatuses}</option>
            {STATUS_KEYS.map((key) => (
              <option key={key} value={key}>
                {t.admin.leads.statuses[key]}
              </option>
            ))}
          </select>
        ) : null}
        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          aria-label={t.admin.leads.allTypes}
          className="h-[40px] border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none"
        >
          <option value="">{t.admin.leads.allTypes}</option>
          {Object.entries(t.lead.types).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={source}
          onChange={(event) => setSource(event.target.value)}
          aria-label={t.admin.leads.allSources}
          className="h-[40px] border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none"
        >
          <option value="">{t.admin.leads.allSources}</option>
          {sources.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          value={cluster}
          onChange={(event) => setCluster(event.target.value)}
          aria-label={t.admin.leads.allClusters}
          className="h-[40px] border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none"
        >
          <option value="">{t.admin.leads.allClusters}</option>
          {Object.entries(t.admin.leads.clusters).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          aria-label={t.admin.leads.dateFrom}
          className="h-[40px] border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none"
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSortDesc((value) => !value)}
          className="text-[11.5px] uppercase tracking-[0.14em] text-[#8f9a9f] hover:text-white"
        >
          {t.admin.leads.columns.created} {sortDesc ? '↓' : '↑'}
        </button>
        <span className="text-[11.5px] text-[#6f7a7f]">{filtered.length}</span>
        {view === 'table' ? (
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-[11.5px] text-[#8f9a9f] hover:text-white">
            <input
              type="checkbox"
              checked={showDealValue}
              onChange={(event) => setShowDealValue(event.target.checked)}
              className="h-3.5 w-3.5 accent-[#c8102e]"
            />
            {t.admin.leads.showDealValue}
          </label>
        ) : null}
      </div>

      {error ? <p className="mt-3 border border-[#c9b28c]/40 px-3 py-2 text-[12.5px] text-[#c9b28c]">{error}</p> : null}

      <div className="mt-4">
        {view === 'table' ? (
          <LeadsTable
            leads={filtered}
            loading={loading}
            onOpen={setSelected}
            showDealValue={showDealValue}
            openTasks={tasksByLead}
          />
        ) : (
          <LeadsKanban leads={filtered} onMove={onMove} />
        )}
      </div>

      <LeadDetail lead={selected} onClose={() => setSelected(null)} />

      <StatusTransitionDialog
        transition={transition}
        onClose={() => setTransition(null)}
        onDone={(updated) => {
          replaceLead(updated);
          setTransition(null);
        }}
      />
    </div>
  );
}