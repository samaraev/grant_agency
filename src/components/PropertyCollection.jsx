import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import BuildingCard from '@/components/BuildingCard';
import SectionHeading from '@/components/SectionHeading';

export default function PropertyCollection({ marker, title, subtitle, items, linkTo, linkLabel }) {
  if (!items?.length) return null;

  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading marker={marker} title={title} subtitle={subtitle} />
          <Link
            to={linkTo}
            className="flex shrink-0 items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#c9b28c] transition-colors hover:text-white"
          >
            {linkLabel}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 3).map((building) => (
            <BuildingCard key={building.id} building={building} />
          ))}
        </div>
      </div>
    </section>
  );
}