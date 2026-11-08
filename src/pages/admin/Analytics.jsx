import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';

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
                {item.count} {suffix}
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

export default function Analytics() {
  const [events, setEvents] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Events.list({ sort: '-created_date', limit: 800 }).catch(() => ({ items: [] })),
      base44.entities.Building.list({ limit: 200 }).catch(() => ({ items: [] })),
    ])
      .then(([eventsPage, buildingsPage]) => {
        setEvents(eventsPage?.items || []);
        setBuildings(buildingsPage?.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const data = useMemo(() => {
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = events.filter((event) => new Date(event.created_date).getTime() >= since);
    const countBy = (list, key) =>
      list.reduce((acc, item) => {
        const value = item[key];
        if (!value) return acc;
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {});

    const searches = recent.filter((event) => event.event_name === 'address_search');
    const topSearches = Object.entries(countBy(searches, 'search_query'))
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const noMatches = Object.entries(
      countBy(
        searches.filter((event) => event.matched === false),
        'search_query'
      )
    )
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

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

    return { topSearches, noMatches, topBuildings };
  }, [events, buildings]);

  return (
    <div>
      <div className="eyebrow">{t.admin.marker}</div>
      <h1 className="mt-3 text-[26px] font-bold text-white">{t.admin.analytics.title}</h1>
      <p className="mt-2 text-[13px] text-[#8f9a9f]">
        {t.admin.analytics.subtitle} · {t.admin.analytics.period}
      </p>

      {loading ? (
        <div className="mt-8 h-40 animate-pulse border border-white/10 bg-[#263033]" />
      ) : (
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <List
            title={t.admin.analytics.topSearches}
            items={data.topSearches}
            suffix={t.admin.analytics.searches}
          />
          <List
            title={t.admin.analytics.noMatches}
            hint={t.admin.analytics.noMatchesHint}
            items={data.noMatches}
            suffix={t.admin.analytics.searches}
          />
          <List
            title={t.admin.analytics.topBuildings}
            items={data.topBuildings}
            suffix={t.admin.analytics.views}
          />
        </div>
      )}
    </div>
  );
}