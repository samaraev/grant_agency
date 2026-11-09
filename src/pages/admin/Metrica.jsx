import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import MetricaStatCard from '@/components/admin/metrica/MetricaStatCard';
import MetricaJoinTable from '@/components/admin/metrica/MetricaJoinTable';
import MetricaQualifiedPages from '@/components/admin/metrica/MetricaQualifiedPages';
import MetricaRangeBar from '@/components/admin/metrica/MetricaRangeBar';

const iso = (date) => date.toISOString().slice(0, 10);
const shift = (days) => iso(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));
const number = (value) => Number(value || 0).toLocaleString('ru-RU');

/** Путь без параметров: Lead.page_path хранится с query. */
function pathOf(value) {
  const raw = String(value || '').trim();
  if (!raw) return '—';
  try {
    return new URL(raw, 'https://placeholder.local').pathname || '/';
  } catch {
    return raw.split('?')[0] || '—';
  }
}

export default function Metrica() {
  const c = t.admin.metrica;
  const [days, setDays] = useState(30);
  const [custom, setCustom] = useState({ from: shift(30), to: iso(new Date()) });
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const { start, end } = useMemo(() => {
    const from = days === 0 ? custom.from : shift(days);
    const to = days === 0 ? custom.to : iso(new Date());
    return {
      from,
      to,
      start: new Date(`${from}T00:00:00+03:00`).getTime(),
      end: new Date(`${to}T23:59:59+03:00`).getTime(),
    };
  }, [days, custom]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const fromIso = new Date(start).toISOString();
    const toIso = new Date(end).toISOString();
    Promise.all([
      base44.functions
        .invoke('fetchMetricaStats', { date_from: iso(new Date(start)), date_to: iso(new Date(end)) })
        .then((res) => res?.data || null)
        .catch(() => null),
      base44.entities.Lead.list({ sort: '-created_date', limit: 500 })
        .then((page) => page?.items || [])
        .catch(() => []),
      base44.entities.StatusHistory.filter(
        {
          to_status: { $in: ['contract_signed', 'deal_closed'] },
          created_date: { $gte: fromIso, $lte: toIso },
        },
        { limit: 500 }
      )
        .then((page) => page?.items || [])
        .catch(() => []),
    ]).then(([statsData, leadList, historyList]) => {
      if (!alive) return;
      setStats(statsData);
      setLeads(leadList);
      setHistory(historyList);
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [start, end]);

  const model = useMemo(() => {
    const inRange = (value) => {
      if (!value) return false;
      const ts = new Date(value).getTime();
      return Number.isFinite(ts) && ts >= start && ts <= end;
    };

    const periodLeads = leads.filter((lead) => inRange(lead.created_date));
    const qualifiedLeads = leads.filter((lead) => inRange(lead.qualified_at));

    const historyByLead = new Map();
    history.forEach((row) => {
      const set = historyByLead.get(row.lead_id) || new Set();
      set.add(row.to_status);
      historyByLead.set(row.lead_id, set);
    });
    const contracts = [...historyByLead.values()].filter((set) => set.has('contract_signed')).length;
    const deals = [...historyByLead.values()].filter((set) => set.has('deal_closed')).length;

    const metricaSources = stats?.ok ? stats.sources || [] : [];
    const rows = metricaSources.map((row) => ({
      source: row.source || '—',
      visits: row.visits,
      leads: 0,
      qualified: 0,
      contracts: 0,
      deals: 0,
    }));
    const byName = new Map(rows.map((row) => [row.source.toLowerCase(), row]));
    const other = { source: c.join.other, visits: null, leads: 0, qualified: 0, contracts: 0, deals: 0 };

    periodLeads.forEach((lead) => {
      const key = String(lead.utm_source || '').trim().toLowerCase();
      const row = (key && byName.get(key)) || other;
      row.leads += 1;
      if (inRange(lead.qualified_at)) row.qualified += 1;
      const set = historyByLead.get(lead.id);
      if (set?.has('contract_signed')) row.contracts += 1;
      if (set?.has('deal_closed')) row.deals += 1;
    });

    if (other.leads) rows.push(other);
    rows.sort((a, b) => (b.visits || 0) - (a.visits || 0) || b.leads - a.leads);

    const pages = new Map();
    qualifiedLeads.forEach((lead) => {
      const key = pathOf(lead.page_path);
      pages.set(key, (pages.get(key) || 0) + 1);
    });
    const pageRows = [...pages.entries()]
      .map(([page, qualified]) => ({ page, qualified }))
      .sort((a, b) => b.qualified - a.qualified)
      .slice(0, 10);

    return {
      visits: stats?.ok ? stats.totals?.visits || 0 : 0,
      users: stats?.ok ? stats.totals?.users || 0 : 0,
      leads: periodLeads.length,
      qualified: qualifiedLeads.length,
      contracts,
      deals,
      rows,
      pageRows,
    };
  }, [leads, history, stats, start, end, c.join.other]);

  const configured = stats?.ok === true;
  const showSetup = !loading && !configured;
  const periodLabel = days === 0 ? `${custom.from} — ${custom.to}` : c.range[`d${days}`];

  return (
    <div>
      <div className="eyebrow">{t.admin.marker}</div>
      <h1 className="mt-3 text-[26px] font-bold text-white">{c.title}</h1>
      <p className="mt-2 text-[13px] text-[#8f9a9f]">{c.subtitle}</p>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <MetricaRangeBar
          days={days}
          from={days === 0 ? custom.from : shift(days)}
          to={days === 0 ? custom.to : iso(new Date())}
          labels={c.range}
          onPreset={setDays}
          onFrom={(value) => {
            setDays(0);
            setCustom((prev) => ({ ...prev, from: value }));
          }}
          onTo={(value) => {
            setDays(0);
            setCustom((prev) => ({ ...prev, to: value }));
          }}
        />
        {stats?.generated_at ? (
          <span className="text-[11px] text-[#6f7a7f]">
            {c.updated} {new Date(stats.generated_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : null}
      </div>

      {showSetup ? (
        <div className="mt-6 border border-white/10 bg-[#263033] p-5">
          <div className="text-[13.5px] font-semibold text-white">
            {stats?.reason === 'no_metrica_token' ? c.noToken.title : c.notConfigured.title}
          </div>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-[#9aa4a8]">
            {stats?.reason === 'no_metrica_token' ? c.noToken.text : c.notConfigured.text}
          </p>
          <Link
            to="/admin/integrations"
            className="mt-4 inline-flex min-h-[36px] items-center border border-white/15 px-3 text-[12px] text-white hover:bg-white/5"
          >
            {c.notConfigured.cta}
          </Link>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <div key={key} className="h-[132px] animate-pulse border border-white/10 bg-[#263033]" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricaStatCard
              label={c.summary.visits}
              value={model.visits}
              note={c.summary.metricaNote}
              details={[{ label: c.cards.period, value: periodLabel }]}
            />
            <MetricaStatCard
              label={c.summary.users}
              value={model.users}
              note={c.summary.metricaNote}
              details={[{ label: c.cards.period, value: periodLabel }]}
            />
            <MetricaStatCard
              label={c.summary.leads}
              value={model.leads}
              note={c.summary.crmNote}
              details={[{ label: c.cards.period, value: periodLabel }]}
            />
            <MetricaStatCard
              label={c.summary.qualified}
              value={model.qualified}
              note={c.summary.qualifiedNote}
              details={[
                { label: c.cards.crm, value: number(model.qualified) },
                {
                  label: c.cards.conversion,
                  value: model.leads ? `${Math.round((model.qualified / model.leads) * 100)}%` : '—',
                },
              ]}
            />
            <MetricaStatCard
              label={c.summary.contracts}
              value={model.contracts}
              note={c.summary.crmNote}
              details={[{ label: c.cards.period, value: periodLabel }]}
            />
            <MetricaStatCard
              label={c.summary.deals}
              value={model.deals}
              note={c.summary.crmNote}
              details={[{ label: c.cards.period, value: periodLabel }]}
            />
          </div>

          <div className="mt-4 border border-white/10 bg-[#263033] p-5">
            <div className="eyebrow">{c.join.title}</div>
            <p className="mt-2 max-w-3xl text-[11.5px] leading-relaxed text-[#6f7a7f]">{c.join.hint}</p>
            <div className="mt-4">
              <MetricaJoinTable rows={model.rows} labels={c.join} empty={c.join.empty} />
            </div>
          </div>

          <div className="mt-4 border border-white/10 bg-[#263033] p-5">
            <div className="eyebrow">{c.pages.title}</div>
            <p className="mt-2 text-[11.5px] text-[#6f7a7f]">{c.pages.hint}</p>
            <div className="mt-4">
              <MetricaQualifiedPages
                rows={model.pageRows}
                labels={c.pages.labels}
                empty={c.pages.empty}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}