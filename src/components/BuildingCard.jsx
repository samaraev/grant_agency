import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { dealLabel, formatArea, formatPrice, propertyTypeLabel } from '@/lib/price';
import { t } from '@/lib/i18n';

export default function BuildingCard({ building }) {
  return (
    <article className="group flex flex-col border border-white/10 bg-[#263033] transition-colors hover:border-[#c8102e]/60">
      <Link to={`/house/${building.id}`} className="relative block overflow-hidden">
        <div className="aspect-[4/3] w-full overflow-hidden bg-[#1f272b]">
          {building.photos?.[0] ? (
            <Image
              src={building.photos[0]}
              alt={`${t.common.photoAlt} ${building.address}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[12px] text-[#6f7a7f]">
              {t.house.noPhotos}
            </div>
          )}
        </div>
        {building.district ? (
          <span className="absolute left-0 top-0 bg-[#1a2025]/85 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#c9b28c]">
            {building.district}
          </span>
        ) : null}
        <span className="absolute right-0 top-0 border-b border-l border-white/15 bg-[#1a2025]/85 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white">
          {dealLabel(building)}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[19px] font-bold leading-snug text-white">
          <Link to={`/house/${building.id}`}>{building.address}</Link>
        </h3>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[15px] font-semibold text-[#c9b28c]">{formatPrice(building)}</span>
          {building.area ? (
            <span className="text-[11.5px] uppercase tracking-[0.12em] text-[#778287]">
              {formatArea(building)}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-[12px] uppercase tracking-[0.14em] text-[#778287]">
          {propertyTypeLabel(building)}
          {building.series_or_type ? ` · ${building.series_or_type}` : ''}
        </p>
        {building.features?.[0] ? (
          <p className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-[#b0b8bc]">
            {building.features[0]}
          </p>
        ) : null}
        <Link
          to={`/house/${building.id}`}
          className="mt-5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:text-[#c9b28c]"
        >
          {t.common.watchHouse}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}