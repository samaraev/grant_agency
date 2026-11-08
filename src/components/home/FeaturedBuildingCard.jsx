import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { t } from '@/lib/i18n';

export default function FeaturedBuildingCard({ building }) {
  const d = t.homepage.discovery;
  const meta = [
    building.floors ? `${building.floors} ${d.floorsUnit}` : null,
    building.ceilings ? `${d.ceilingsLabel} ${building.ceilings} ${d.meterUnit}` : null,
    building.has_lift === true ? d.withLift : building.has_lift === false ? d.withoutLift : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="group flex flex-col border border-white/10 bg-[#1f272b] transition-colors hover:border-[#c9b28c]/40">
      <Link to={`/house/${building.id}`} className="block overflow-hidden">
        <div className="relative aspect-[4/3] w-full bg-[#263033]">
          {building.photos?.[0] ? (
            <Image
              src={building.photos[0]}
              alt={`${t.common.photoAlt} ${building.address}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : null}
          {building.year_built ? (
            <span className="absolute left-0 top-0 bg-[#1a2025]/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[#c9b28c]">
              {building.year_built} · {d.fromDirectory}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[17px] font-semibold leading-snug text-white">
          <Link to={`/house/${building.id}`} className="transition-colors hover:text-[#c9b28c]">
            {building.address}
          </Link>
        </h3>
        {meta ? (
          <p className="mt-2 text-[11.5px] uppercase tracking-[0.1em] text-[#8f9a9f]">{meta}</p>
        ) : null}
        {building.metro ? (
          <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-[#778287]">
            {building.metro}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
          <span className="text-[11.5px] text-[#778287]">
            {building.photos?.length || 0} {d.photosSuffix}
          </span>
          <Link
            to={`/house/${building.id}`}
            className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#c9b28c] transition-colors hover:text-white"
          >
            {d.study}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}