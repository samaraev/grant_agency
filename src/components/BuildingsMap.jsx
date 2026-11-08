import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowRight, Play } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const DEFAULT_CENTER = [54.1938, 37.6178];

export default function BuildingsMap({ buildings = [], onContact, className, height = 'h-[420px] lg:h-[540px]' }) {
  const withCoords = buildings.filter((item) => item.latitude && item.longitude);
  const [selected, setSelected] = useState(withCoords[0] || null);
  const center = withCoords.length
    ? [Number(withCoords[0].latitude), Number(withCoords[0].longitude)]
    : DEFAULT_CENTER;

  return (
    <div className={cn('grid gap-6 lg:grid-cols-[1fr_360px]', className)}>
      <div className={cn('relative overflow-hidden border border-white/10', height)}>
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom={false}
          className="h-full w-full"
          attributionControl
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {withCoords.map((building) => (
            <CircleMarker
              key={building.id}
              center={[Number(building.latitude), Number(building.longitude)]}
              radius={selected?.id === building.id ? 11 : 7}
              pathOptions={{
                color: '#c8102e',
                fillColor: selected?.id === building.id ? '#c8102e' : '#f4a7b0',
                fillOpacity: 0.95,
                weight: 2,
              }}
              eventHandlers={{ click: () => setSelected(building) }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                {building.address}
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
        {withCoords.length === 0 ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#1a2025]/70 text-[13px] text-[#b0b8bc]">
            {t.common.empty}
          </div>
        ) : null}
      </div>

      <aside className="flex flex-col border border-white/10 bg-[#263033]">
        {selected ? (
          <>
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1f272b]">
              {selected.photos?.[0] ? (
                <Image
                  src={selected.photos[0]}
                  alt={`${t.common.photoAlt} ${selected.address}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : null}
              <span className="absolute bottom-0 left-0 bg-[#1a2025]/85 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#f4a7b0]">
                {selected.district}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-[20px] font-bold leading-snug text-white">{selected.address}</h3>
              <p className="mt-2 text-[12px] uppercase tracking-[0.14em] text-[#778287]">
                {selected.year_built ? `${selected.year_built} · ` : ''}
                {selected.floors ? `${selected.floors} ${t.common.floorShort} · ` : ''}
                {selected.series_or_type || ''}
              </p>

              <div className="mt-4 border border-white/10 bg-[#1f272b]">
                {selected.videos?.[0] ? (
                  <video
                    src={selected.videos[0]}
                    controls
                    preload="none"
                    playsInline
                    className="aspect-video w-full bg-black object-cover"
                  >
                    {t.house.videoTitle}
                  </video>
                ) : (
                  <div className="flex aspect-video items-center justify-center gap-2 text-[12px] text-[#6f7a7f]">
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.home.map.noVideo}
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-2">
                {onContact ? (
                  <button
                    type="button"
                    onClick={() => onContact(selected)}
                    className="flex min-h-[44px] items-center justify-center gap-2 bg-[#c8102e] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#a80d26]"
                  >
                    {t.home.map.contactAbout}
                  </button>
                ) : null}
                <Link
                  to={`/house/${selected.id}`}
                  className="flex min-h-[44px] items-center justify-center gap-2 border border-white/15 px-4 text-[13px] font-medium text-white transition-colors hover:border-[#f4a7b0] hover:text-[#f4a7b0]"
                >
                  {t.home.map.openHouse}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-[13px] text-[#8f9a9f]">
            {t.search.noResults}
          </div>
        )}
      </aside>
    </div>
  );
}