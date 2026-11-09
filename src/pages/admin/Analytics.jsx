import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { STATUS_KEYS, normalizeStatus, reachedQualified, statusIndex } from '@/lib/leadStatus';
import AgentStats from '@/components/admin/analytics/AgentStats';

function List({ title, hint, items, suffix }) {
  return (
    <div className="border border-white/10 bg-[#263033] p-5">
      <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{title}</div>
      {hint ? <p className="mt-1 text-[11.5px] text-[#6f7a7f]">{hint}</p> : null}
      {items.length ? (
        <ul className="mt-4 space-y-2.5">
          {items.map((item) => (
            <li key={item.label} className="flex items-baseline justify-between gap-4">
              <span className="truncate text-[13px] text-[#d7dcde]">{item.label}</span>
              <span className="shrink-0 text-[12px] text-white">
                {item.count} {item.suffix || suffix}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[13px] text-[#8f9a9f]">{t.admin.analytics.empty}</p>
      )}
    </div>
  );
}

const countBy = (list, key) =>
  list.reduce((acc, item) => {
    const value = typeof key === 'function' ? key(item) : item[key];
    if (!value) return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

const toRows = (map, limit = 8) =>
  Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

export default function Analytics() {
  const copy = t.admin.analytics;
  const [events, setEvents] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Events.list({ sort: '-created_date', limit: 800 }).catch(() => ({ items: [] })),
      base44.entities.Building.list({ limit: 200 }).catch(() => ({ items: [] })),
      base44.entities.Lead.list({ sort: '-created_date', limit: 500 }).catch(() => ({ items: [] })),
    ])
      .then(([eventsPage, buildingsPage, leadPage]) => {
        setEvents(eventsPage?.items || []);
        setBuildings(buildingsPage?.items || []);
        setLeads(leadPage?.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const data = useMemo(() => {
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = events.filter((event) => new Date(event.created_date).getTime() >= since);
    const periodLeads = leads.filter((lead) => new Date(lead.created_date).getTime() >= since);
    const qualified = periodLeads.filter((lead) => reachedQualified(lead.status));

    const searches = recent.filter((event) => event.event_name === 'address_search');
    const topSearches = toRows(countBy(searches, 'search_query'));
    const noMatches = toRows(
      countBy(
        searches.filter((event) => event.matched === false),
        'search_query'
      ),
      10
    );

    const views = countBy(
      recent.filter((event) => event.event_name === 'building_view'),
      'building_id'
    );
    const topBuildings = Object.entries(views)
      .map(([id, count]) => ({
        label: buildings.find((building) => building.id === id)?.address || id,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const qualifiedBySource = toRows(countBy(qualified, (lead) => lead.source || 'direct'), 8);
    const qualifiedByPage = toRows(countBy(qualified, (lead) => lead.page_path || '—'), 8);

    const totals = Object.fromEntries(
      STATUS_KEYS.map((key) => [
        key,
        periodLeads.filter((lead) => normalizeStatus(lead.status) === key).length,
      ])
    );
    const reached = STATUS_KEYS.filter((key) => key !== 'non_target').map((key) => {
      const index = statusIndex(key);
      return {
        key,
        count: periodLeads.filter((lead) => statusIndex(lead.status) >= index).length,
      };
    });
    const funnelConversion = reached.map((row, index) => ({
      key: row.key,
      count: row.count,
      percent: index === 0 ? (periodLeads.length ? 100 : 0) : reached[index - 1].count
        ? Math.round((row.count / reached[index - 1].count) * 100)
        : 0,
    }));

    const owners = periodLeads.filter(
      (lead) => lead.person_role === 'owner' || String(lead.type).startsWith('owner')
    ).length;
    const buyers = periodLeads.filter(
      (lead) => lead.person_role === 'buyer' || String(lead.type).startsWith('buyer')
    ).length;
    const inTarget = periodLeads.filter((lead) => lead.area_flag === 'in_target').length;
    const outside = periodLeads.filter((lead) => lead.area_flag === 'outside').length;
    const rejections = toRows(
      countBy(
        periodLeads.filter((lead) => lead.status === 'non_target'),
        (lead) => lead.rejection_reason || '—'
      ),
      10
    );

    const formStarts = recent.filter((event) => event.event_name === 'form_start').length;
    const formSuccess = recent.filter((event) => event.event_name === 'form_submit_success').length;

    return {
      topSearches,
      noMatches,
      topBuildings,
      qualifiedTotal: qualified.length,
      periodTotal: periodLeads.length,
      qualifiedBySource,
      qualifiedByPage,
      totals,
      funnelConversion,
      owners,
      buyers,
      inTarget,
      outside,
      rejections,
      formStarts,
      formSuccess,
      dropoff: formStarts ? Math.round(((formStarts - formSuccess) / formStarts) * 100) : 0,
    };
  }, [events, buildings, leads]);

  const suffix = copy.leadsSuffix;

  return (
    <div>
      <div className="eyebrow">{t.admin.marker}</div>
      <h1 className="mt-3 text-[26px] font-bold text-white">{copy.title}</h1>
      <p className="mt-2 text-[13px] text-[#8f9a9f]">
        {copy.subtitle} · {copy.period}
      </p>

      {loading ? (
        <div className="mt-8 h-40 animate-pulse border border-white/10 bg-[#263033]" />
      ) : (
        <div className="mt-8 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <List title={copy.topSearches} items={data.topSearches} suffix={copy.searches} />
            <List title={copy.noMatches} hint={copy.noMatchesHint} items={data.noMatches} suffix={copy.searches} />
            <List title={copy.topBuildings} items={data.topBuildings} suffix={copy.views} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <List
              title={`${copy.qualifiedTitle} · ${copy.qualifiedBySource}`}
              hint={`${data.qualifiedTotal} ${copy.ofTotal} ${data.periodTotal}`}
              items={data.qualifiedBySource}
              suffix=""
            />
            <List
              title={`${copy.qualifiedTitle} · ${copy.qualifiedByPage}`}
              items={data.qualifiedByPage}
              suffix=""
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="border border-white/10 bg-[#263033] p-5">
              <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                {copy.funnelConversion}
              </div>
              <ul className="mt-4 space-y-2">
                {data.funnelConversion.map((row, index) => (
                  <li key={row.key} className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[13px] text-[#d7dcde]">{t.admin.leads.statuses[row.key]}</span>
                    <span className="shrink-0 text-[12px] text-white">
                      {row.count}
                      <span className={index === 0 ? 'text-[#6f7a7f]' : 'text-[#c9b28c]'}> · {row.percent}%</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <div className="border border-white/10 bg-[#263033] p-5">
                <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{copy.ownerVsBuyer}</div>
                <ul className="mt-4 space-y-2">
                  <li className="flex justify-between text-[13px] text-[#d7dcde]">
                    <span>{copy.owners}</span>
                    <span className="text-white">{data.owners}</span>
                  </li>
                  <li className="flex justify-between text-[13px] text-[#d7dcde]">
                    <span>{copy.buyers}</span>
                    <span className="text-white">{data.buyers}</span>
                  </li>
                </ul>
              </div>
              <div className="border border-white/10 bg-[#263033] p-5">
                <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{copy.areaSplit}</div>
                <ul className="mt-4 space-y-2">
                  <li className="flex justify-between text-[13px] text-[#d7dcde]">
                    <span>{copy.inTarget}</span>
                    <span className="text-white">{data.inTarget}</span>
                  </li>
                  <li className="flex justify-between text-[13px] text-[#d7dcde]">
                    <span>{copy.outside}</span>
                    <span className="text-white">{data.outside}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <List title={copy.rejections} items={data.rejections} suffix="" />
            <div className="border border-white/10 bg-[#263033] p-5">
              <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{copy.formDropoff}</div>
              <ul className="mt-4 space-y-2">
                <li className="flex justify-between text-[13px] text-[#d7dcde]">
                  <span>{copy.formStarts}</span>
                  <span className="text-white">{data.formStarts}</span>
                </li>
                <li className="flex justify-between text-[13px] text-[#d7dcde]">
                  <span>{copy.formSuccess}</span>
                  <span className="text-white">{data.formSuccess}</span>
                </li>
                <li className="flex justify-between border-t border-white/10 pt-2 text-[13px] text-[#c9b28c]">
                  <span>{copy.dropoff}</span>
                  <span>{data.dropoff}%</span>
                </li>
              </ul>
            </div>
          </div>

          <AgentStats leads={leads} />
        </div>
      )}
    </div>
  );
}