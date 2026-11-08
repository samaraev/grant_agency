import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, Map as MapIcon, Search as SearchIcon, X } from 'lucide-react';
import AddressSearch from '@/components/AddressSearch';
import BuildingCard from '@/components/BuildingCard';
import BuildingsMap from '@/components/BuildingsMap';
import LeadForm from '@/components/LeadForm';
import SectionHeading from '@/components/SectionHeading';
import { Skeleton } from '@/components/ui/skeleton';
import { useBuildingList } from '@/hooks/useBuildings';
import { useLead } from '@/components/LeadProvider';
import { PROPERTY_GROUPS } from '@/lib/price';
import { applySeo } from '@/lib/seo';
import { track } from '@/lib/track';
import { t } from '@/lib/i18n';
import { useLang } from '@/components/LanguageProvider';
import { cn } from '@/lib/utils';

export default function Search() {
  const [params, setParams] = useSearchParams();
  const { openLead } = useLead();
  const { buildings, loading } = useBuildingList({ limit: 200 });
  const [view, setView] = useState('list');
  const { lang } = useLang();

  const q = params.get('q') || '';
  const district = params.get('district') || '';
  const street = params.get('street') || '';
  const group = params.get('group') || '';
  const deal = params.get('deal') || '';

  useEffect(() => {
    return applySeo({ ...t.meta.search, path: '/search' });
  }, [lang]);

  useEffect(() => {
    track(t.track.pageView, { page: 'search' });
  }, []);

  const districts = useMemo(
    () => [...new Set(buildings.map((item) => item.district).filter(Boolean))].sort(),
    [buildings]
  );
  const streets = useMemo(
    () => [...new Set(buildings.map((item) => item.street).filter(Boolean))].sort(),
    [buildings]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return buildings.filter((item) => {
      const haystack = `${item.address} ${item.street || ''} ${item.district || ''}`.toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (district && item.district !== district) return false;
      if (street && item.street !== street) return false;
      if (group && !(PROPERTY_GROUPS[group] || []).includes(item.property_type)) return false;
      if (deal && (item.deal_type || 'sale') !== deal) return false;
      return true;
    });
  }, [buildings, q, district, street, group, deal]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const hasFilters = Boolean(q || district || street || group || deal);

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8 lg:py-16">
      <SectionHeading
        level={1}
        marker={t.search.marker}
        title={t.search.title}
        subtitle={t.search.subtitle}
      />

      <div className="mt-10 flex flex-wrap items-end gap-4">
        <div className="min-w-[240px] flex-1 basis-full lg:basis-[300px]">
          <AddressSearch
            buildings={buildings}
            size="sm"
            label={t.search.inputLabel}
            placeholder={t.search.inputPlaceholder}
          />
        </div>

        <div>
          <label htmlFor="filter-group" className="eyebrow mb-2 block">
            {t.common.type}
          </label>
          <select
            id="filter-group"
            value={group}
            onChange={(event) => update('group', event.target.value)}
            className="h-[40px] w-full border-b border-white/25 bg-transparent text-[14px] text-white focus:border-[#c8102e] focus:outline-none lg:w-[230px]"
          >
            <option value="" className="bg-[#263033]">
              {t.search.groupAll}
            </option>
            {Object.entries(t.groups).map(([value, label]) => (
              <option key={value} value={value} className="bg-[#263033]">
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-deal" className="eyebrow mb-2 block">
            {t.common.deal}
          </label>
          <select
            id="filter-deal"
            value={deal}
            onChange={(event) => update('deal', event.target.value)}
            className="h-[40px] w-full border-b border-white/25 bg-transparent text-[14px] text-white focus:border-[#c8102e] focus:outline-none lg:w-[180px]"
          >
            <option value="" className="bg-[#263033]">
              {t.search.dealAll}
            </option>
            {Object.entries(t.deals).map(([value, label]) => (
              <option key={value} value={value} className="bg-[#263033]">
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-district" className="eyebrow mb-2 block">
            {t.common.district}
          </label>
          <select
            id="filter-district"
            value={district}
            onChange={(event) => update('district', event.target.value)}
            className="h-[40px] w-full border-b border-white/25 bg-transparent text-[14px] text-white focus:border-[#c8102e] focus:outline-none lg:w-[190px]"
          >
            <option value="" className="bg-[#263033]">
              {t.search.districtAll}
            </option>
            {districts.map((value) => (
              <option key={value} value={value} className="bg-[#263033]">
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-street" className="eyebrow mb-2 block">
            {t.common.street}
          </label>
          <select
            id="filter-street"
            value={street}
            onChange={(event) => update('street', event.target.value)}
            className="h-[40px] w-full border-b border-white/25 bg-transparent text-[14px] text-white focus:border-[#c8102e] focus:outline-none lg:w-[210px]"
          >
            <option value="" className="bg-[#263033]">
              {t.search.streetAll}
            </option>
            {streets.map((value) => (
              <option key={value} value={value} className="bg-[#263033]">
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border border-white/15">
            <button
              type="button"
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              className={cn(
                'flex min-h-[38px] items-center gap-2 px-3 text-[12px] transition-colors',
                view === 'list' ? 'bg-[#c8102e] text-white' : 'text-[#b0b8bc] hover:text-white'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              {t.search.listView}
            </button>
            <button
              type="button"
              onClick={() => setView('map')}
              aria-pressed={view === 'map'}
              className={cn(
                'flex min-h-[38px] items-center gap-2 px-3 text-[12px] transition-colors',
                view === 'map' ? 'bg-[#c8102e] text-white' : 'text-[#b0b8bc] hover:text-white'
              )}
            >
              <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {t.search.mapView}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] uppercase tracking-[0.16em] text-[#778287]">
          {t.search.found}: <span className="text-white">{filtered.length}</span>
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => setParams({}, { replace: true })}
            className="flex items-center gap-1.5 text-[12px] text-[#c9b28c] hover:text-white"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            {t.search.clear}
          </button>
        ) : null}
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border border-white/10 bg-[#263033]">
                <Skeleton className="aspect-[4/3] w-full bg-white/10" />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-5 w-2/3 bg-white/10" />
                  <Skeleton className="h-3 w-1/3 bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          view === 'list' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((building) => (
                <BuildingCard key={building.id} building={building} />
              ))}
            </div>
          ) : (
            <BuildingsMap
              buildings={filtered}
              onContact={(building) =>
                openLead({
                  type: 'buyer_check',
                  address: building.address,
                  building_id: building.id,
                })
              }
            />
          )
        ) : (
          <div className="grid gap-8 border border-white/10 bg-[#263033] p-6 lg:grid-cols-[1fr_1fr] lg:p-10">
            <div>
              <div className="flex h-11 w-11 items-center justify-center border border-white/15">
                <SearchIcon className="h-5 w-5 text-[#c9b28c]" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-[24px] font-bold text-white">{t.search.emptyTitle}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-[#b0b8bc]">{t.search.emptyText}</p>
              {hasFilters ? (
                <p className="mt-4 text-[12.5px] text-[#778287]">
                  {t.search.noResults}
                  {q ? ` «${q}»` : ''}
                </p>
              ) : null}
            </div>
            <div className="border-t border-white/10 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <LeadForm defaultType="general" defaultAddress={q} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}