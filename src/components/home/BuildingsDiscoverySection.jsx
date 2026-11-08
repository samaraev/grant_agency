import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Search, X } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import FeaturedBuildingCard from '@/components/home/FeaturedBuildingCard';
import { featuredBuildings } from '@/lib/khamovniki';
import { t } from '@/lib/i18n';

const GROUPS = ['park_kultury', 'frunzenskaya', 'plushchiha'];
const DIRECTORY_URL = 'https://rieltorcenter.ru/houses/';

export default function BuildingsDiscoverySection({ buildings = [] }) {
  const d = t.homepage.discovery;
  const featured = featuredBuildings(buildings);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return featured.filter((item) => {
      const inGroup = group === 'all' || item.neighborhood_group === group;
      const haystack = `${item.address || ''} ${item.street || ''} ${item.metro || ''}`.toLowerCase();
      return inGroup && (!needle || haystack.includes(needle));
    });
  }, [featured, group, query]);

  return (
    <section className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading marker={d.marker} title={d.title} subtitle={d.subtitle} />
        <div className="flex shrink-0 flex-col gap-2 lg:items-end">
          <Link
            to="/search"
            className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#c9b28c] transition-colors hover:text-white"
          >
            {d.directory}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <a
            href={DIRECTORY_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-[12px] text-[#8f9a9f] transition-colors hover:text-white"
          >
            {d.directoryExternal}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>

      {!featured.length ? (
        <div className="mt-10 border border-white/10 bg-[#1f272b] p-6">
          <p className="max-w-2xl text-[13.5px] leading-relaxed text-[#b0b8bc]">{d.empty}</p>
          <a
            href={DIRECTORY_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 border border-white/15 px-5 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-[#c9b28c] hover:text-[#c9b28c]"
          >
            {d.directoryExternal}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      ) : (
        <>
          <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#778287]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={d.searchPlaceholder}
                aria-label={d.searchPlaceholder}
                className="h-[48px] w-full border border-white/15 bg-[#1f272b] pl-11 pr-11 text-[14px] text-white placeholder:text-[#778287] focus:border-[#c9b28c] focus:outline-none"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={d.reset}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-[#8f9a9f] transition-colors hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {['all', ...GROUPS].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setGroup(key)}
                  aria-pressed={group === key}
                  className={
                    group === key
                      ? 'min-h-[44px] border border-[#c9b28c] bg-[#c9b28c] px-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#1a2025]'
                      : 'min-h-[44px] border border-white/15 px-4 text-[12px] uppercase tracking-[0.1em] text-[#b0b8bc] transition-colors hover:border-[#c9b28c] hover:text-[#c9b28c]'
                  }
                >
                  {d.filters[key]}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-[12px] uppercase tracking-[0.12em] text-[#778287]">
            {d.counterFound} {visible.length} {d.counterOf} {featured.length} {d.counterSuffix}
          </p>

          {visible.length ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((building) => (
                <FeaturedBuildingCard key={building.id} building={building} />
              ))}
            </div>
          ) : (
            <div className="mt-6 border border-white/10 bg-[#1f272b] p-6">
              <h3 className="font-heading text-[22px] text-white">{d.notFoundTitle}</h3>
              <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-[#b0b8bc]">
                {d.notFoundText}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setGroup('all');
                  }}
                  className="min-h-[44px] border border-white/20 px-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-[#c9b28c] hover:text-[#c9b28c]"
                >
                  {d.reset}
                </button>
                <a
                  href={DIRECTORY_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 px-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#c9b28c] transition-colors hover:text-white"
                >
                  {d.directoryExternal}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          )}

          <p className="mt-6 max-w-3xl text-[12px] leading-relaxed text-[#778287]">{d.note}</p>
        </>
      )}
    </section>
  );
}