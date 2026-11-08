import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import BuildingCard from '@/components/BuildingCard';
import SectionHeading from '@/components/SectionHeading';
import { publishedKhamovniki } from '@/lib/khamovniki';
import { t } from '@/lib/i18n';

export default function PriorityBuildings({ buildings = [] }) {
  const list = publishedKhamovniki(buildings);

  return (
    <section className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          marker={t.home.priority.marker}
          title={t.home.priority.title}
          subtitle={t.home.priority.subtitle}
        />
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Link
            to="/search"
            className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#c9b28c] transition-colors hover:text-white"
          >
            {t.home.priority.all}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            to="/khamovniki"
            className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8f9a9f] transition-colors hover:text-white"
          >
            {t.home.priority.cluster}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {list.length ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.slice(0, 6).map((building) => (
            <BuildingCard key={building.id} building={building} showFlags />
          ))}
        </div>
      ) : (
        <div className="mt-10 border border-white/10 bg-[#1f272b] p-6">
          <p className="max-w-2xl text-[13.5px] leading-relaxed text-[#b0b8bc]">
            {t.home.priority.empty}
          </p>
          <Link
            to="/search"
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 border border-white/15 px-5 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-[#c9b28c] hover:text-[#c9b28c]"
          >
            {t.home.priority.all}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}