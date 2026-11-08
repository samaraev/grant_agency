import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, ArrowRight, MapPin, Play } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useLead } from '@/components/LeadProvider';
import { useBuilding } from '@/hooks/useBuildings';
import { dealLabel, formatArea, formatPrice, propertyTypeLabel } from '@/lib/price';
import { base44 } from '@/api/base44Client';
import { applySeo } from '@/lib/seo';
import { track } from '@/lib/track';
import { t } from '@/lib/i18n';
import { useLang } from '@/components/LanguageProvider';
import { cn } from '@/lib/utils';

const DECISIONS = [
  { type: 'owner_appraise', className: 'bg-[#eee7dc] text-[#1a2025] hover:bg-white' },
  { type: 'owner_sell', className: 'border border-[#c9b28c] text-[#c9b28c] hover:bg-[#c9b28c] hover:text-[#1a2025]' },
  { type: 'buyer_buy', className: 'border border-white/20 text-white hover:border-[#c9b28c] hover:text-[#c9b28c]' },
];

export default function House() {
  const { id } = useParams();
  const { building, loading } = useBuilding(id);
  const { openLead } = useLead();
  const { lang } = useLang();
  const [activePhoto, setActivePhoto] = useState(0);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (!id) return;
    base44.entities.ApartmentNote.filter({ building_id: id }, { limit: 20 })
      .then((page) => setNotes(page?.items || []))
      .catch(() => setNotes([]));
  }, [id]);

  useEffect(() => {
    if (loading) return;
    if (!building) {
      const meta = document.createElement('meta');
      meta.name = 'prerender-status-code';
      meta.content = '404';
      document.head.appendChild(meta);
      applySeo({ ...t.meta.notFound, robots: 'noindex, follow', path: `/house/${id}` });
      return () => meta.remove();
    }
    const cleanup = applySeo({
      title: `${building.address} ${t.meta.house.suffix}`,
      description:
        building.description ||
        `Дом ${building.address}: характеристики, особенности и консультация специалиста, который знает район.`,
      image: building.photos?.[0],
      path: `/house/${building.id}`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Place',
        name: building.address,
        description: building.description,
        address: {
          '@type': 'PostalAddress',
          streetAddress: `${building.street || ''}, ${building.house_number || ''}`,
          addressLocality: building.city || 'Москва',
          addressCountry: 'RU',
        },
        geo:
          building.latitude && building.longitude
            ? { '@type': 'GeoCoordinates', latitude: building.latitude, longitude: building.longitude }
            : undefined,
        photo: building.photos || [],
      },
    });
    return cleanup;
  }, [building, loading, id, lang]);

  useEffect(() => {
    if (!building) return;
    track(t.track.buildingView, { building_id: building.id, address: building.address });
  }, [building]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8">
        <Skeleton className="h-8 w-64 bg-white/10" />
        <Skeleton className="mt-6 aspect-[16/9] w-full bg-white/10" />
        <Skeleton className="mt-6 h-24 w-full bg-white/10" />
      </div>
    );
  }

  if (!building) {
    return (
      <div className="mx-auto max-w-[1240px] px-5 py-20 lg:px-8">
        <div className="eyebrow">{t.house.marker}</div>
        <h1 className="mt-4 text-[30px] font-bold text-white">{t.house.notFoundTitle}</h1>
        <p className="mt-3 max-w-xl text-[14px] text-[#b0b8bc]">{t.house.notFoundText}</p>
        <button
          type="button"
          onClick={() => openLead({ type: 'general' })}
          className="mt-6 flex min-h-[46px] items-center gap-2 bg-[#c8102e] px-5 text-[13px] font-semibold text-white"
        >
          {t.search.emptyCta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <Link to="/search" className="mt-6 block text-[13px] text-[#c9b28c]">
          {t.house.backToSearch}
        </Link>
      </div>
    );
  }

  const photos = building.photos?.length ? building.photos : [];
  const current = photos[activePhoto] || photos[0];

  return (
    <div className="pb-24 lg:pb-0">
      <div className="mx-auto max-w-[1240px] px-5 pt-8 lg:px-8 lg:pt-12">
        <Link
          to="/search"
          className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-[#8f9a9f] transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t.house.backToSearch}
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow flex items-center gap-2">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {[building.city, building.district].filter(Boolean).join(' · ')}
            </div>
            <h1 className="mt-3 text-[32px] font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-[46px]">
              {building.address}
            </h1>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <span className="border border-[#c9b28c]/40 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[#c9b28c]">
                {dealLabel(building)}
              </span>
              <span className="text-[12px] uppercase tracking-[0.14em] text-[#b0b8bc]">
                {propertyTypeLabel(building)}
              </span>
              <span className="text-[16px] font-semibold text-white">{formatPrice(building)}</span>
              {building.area ? (
                <span className="text-[12px] text-[#778287]">{formatArea(building)}</span>
              ) : null}
            </div>
          </div>
          {building.updated_at ? (
            <p className="text-[11.5px] uppercase tracking-[0.16em] text-[#778287]">
              {t.house.updated}: {building.updated_at}
            </p>
          ) : null}
        </div>

        {/* AT A GLANCE */}
        <dl className="mt-7 grid grid-cols-2 gap-px border-y border-white/10 bg-white/10 sm:grid-cols-4">
          {[
            { label: t.common.year, value: building.year_built },
            { label: t.common.floors, value: building.floors },
            { label: t.common.entrances, value: building.entrances },
            building.property_type && building.property_type !== 'residential'
              ? { label: t.common.area, value: building.area ? formatArea(building) : '' }
              : { label: t.common.apartments, value: building.apartments_count },
          ].map((item) => (
            <div key={item.label} className="bg-[#1a2025] px-4 py-4">
              <dt className="text-[10px] uppercase tracking-[0.18em] text-[#778287]">{item.label}</dt>
              <dd className="mt-1.5 text-[22px] font-bold text-white">{item.value || '—'}</dd>
            </div>
          ))}
        </dl>

        {/* GALLERY */}
        <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_180px]">
          <div className="relative aspect-[16/10] w-full overflow-hidden border border-white/10 bg-[#1f272b]">
            {current ? (
              <Image
                src={current}
                alt={`${building.address} — фотография дома`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[13px] text-[#6f7a7f]">
                {t.house.noPhotos}
              </div>
            )}
          </div>
          {photos.length > 1 ? (
            <div className="grid grid-cols-4 gap-3 lg:grid-cols-1">
              {photos.map((photo, index) => (
                <button
                  key={photo}
                  type="button"
                  onClick={() => setActivePhoto(index)}
                  className={cn(
                    'aspect-[4/3] overflow-hidden border transition-colors lg:aspect-[4/3]',
                    index === activePhoto ? 'border-[#c8102e]' : 'border-white/10 hover:border-white/30'
                  )}
                  aria-label={`${t.house.gallery} ${index + 1}`}
                >
                  <Image
                    src={photo}
                    alt={`${building.address} — фото ${index + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_360px] lg:gap-14">
          <div>
            {/* DESCRIPTION */}
            <section>
              <div className="eyebrow">{t.house.editorialTitle}</div>
              <p className="mt-4 text-[15px] leading-[1.75] text-[#d7dcde]">{building.description}</p>
            </section>

            {/* CHARACTERISTICS */}
            <section className="mt-10">
              <h2 className="text-[20px] font-bold text-white">{t.house.characteristics}</h2>
              <dl className="mt-4 divide-y divide-white/10 border-y border-white/10">
                {[
                  { label: t.common.type, value: propertyTypeLabel(building) },
                  { label: t.common.deal, value: dealLabel(building) },
                  { label: t.common.area, value: building.area ? formatArea(building) : '' },
                  { label: t.common.price, value: formatPrice(building) },
                  { label: t.common.series, value: building.series_or_type },
                  { label: t.common.district, value: building.district },
                  { label: t.common.street, value: building.street },
                  { label: t.common.year, value: building.year_built },
                  { label: t.common.floors, value: building.floors },
                  { label: t.common.entrances, value: building.entrances },
                  { label: t.common.apartments, value: building.apartments_count },
                ]
                  .filter((row) => row.value)
                  .map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between gap-6 py-3">
                      <dt className="text-[12.5px] uppercase tracking-[0.12em] text-[#778287]">
                        {row.label}
                      </dt>
                      <dd className="text-right text-[14px] text-white">{row.value}</dd>
                    </div>
                  ))}
              </dl>
            </section>

            {/* FEATURES */}
            {building.features?.length ? (
              <section className="mt-10">
                <h2 className="text-[20px] font-bold text-white">{t.house.featuresTitle}</h2>
                <ul className="mt-4 grid gap-px bg-white/10">
                  {building.features.map((feature) => (
                    <li key={feature} className="flex gap-3 bg-[#1a2025] py-4 text-[14px] leading-relaxed text-[#d7dcde]">
                      <span className="mt-2 h-[5px] w-[5px] shrink-0 bg-[#c8102e]" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* APARTMENT NOTES */}
            {notes.length ? (
              <section className="mt-10">
                <h2 className="text-[20px] font-bold text-white">{t.house.layoutTitle}</h2>
                <div className="mt-4 space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="border border-white/10 bg-[#263033] p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-[16px] font-semibold text-white">{note.layout_type}</h3>
                        {note.area_range ? (
                          <span className="text-[12px] uppercase tracking-[0.14em] text-[#c9b28c]">
                            {note.area_range}
                          </span>
                        ) : null}
                      </div>
                      {note.typical_issues ? (
                        <p className="mt-3 text-[13.5px] leading-relaxed text-[#b0b8bc]">
                          <span className="text-[#778287]">{t.house.typicalIssues}: </span>
                          {note.typical_issues}
                        </p>
                      ) : null}
                      {note.liquidity_note ? (
                        <p className="mt-2 text-[13.5px] leading-relaxed text-[#b0b8bc]">
                          <span className="text-[#778287]">{t.house.liquidity}: </span>
                          {note.liquidity_note}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* VIDEO */}
            <section className="mt-10">
              <h2 className="text-[20px] font-bold text-white">{t.house.videoTitle}</h2>
              {building.videos?.[0] ? (
                <video
                  src={building.videos[0]}
                  controls
                  preload="none"
                  playsInline
                  poster={photos[0]}
                  className="mt-4 aspect-video w-full border border-white/10 bg-black"
                >
                  {t.house.videoTitle}
                </video>
              ) : (
                <div className="mt-4 flex aspect-video w-full items-center justify-center gap-2 border border-white/10 bg-[#1f272b] text-[13px] text-[#6f7a7f]">
                  <Play className="h-4 w-4" aria-hidden="true" />
                  {t.home.map.noVideo}
                </div>
              )}
            </section>

            {/* MAP */}
            <section className="mt-10">
              <h2 className="text-[20px] font-bold text-white">{t.house.mapTitle}</h2>
              <div className="mt-4 h-[300px] overflow-hidden border border-white/10">
                {building.latitude && building.longitude ? (
                  <MapContainer
                    center={[Number(building.latitude), Number(building.longitude)]}
                    zoom={16}
                    scrollWheelZoom={false}
                    className="h-full w-full"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <CircleMarker
                      center={[Number(building.latitude), Number(building.longitude)]}
                      radius={10}
                      pathOptions={{ color: '#c8102e', fillColor: '#c8102e', fillOpacity: 0.95, weight: 2 }}
                    >
                      <Tooltip direction="top" offset={[0, -6]}>
                        {building.address}
                      </Tooltip>
                    </CircleMarker>
                  </MapContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-[13px] text-[#6f7a7f]">
                    {t.common.empty}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* DECISION PANEL */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-white/10 bg-[#263033] p-6">
              <div className="eyebrow">{t.house.marker}</div>
              <h2 className="mt-3 text-[21px] font-bold leading-snug text-white">
                {t.house.decisionTitle}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[#b0b8bc]">{t.house.decisionText}</p>
              <div className="mt-5 flex flex-col gap-2">
                {DECISIONS.map((decision) => (
                  <button
                    key={decision.type}
                    type="button"
                    onClick={() =>
                      openLead({
                        type: decision.type,
                        address: building.address,
                        building_id: building.id,
                      })
                    }
                    className={cn(
                      'flex min-h-[46px] items-center justify-between gap-3 px-4 text-[13px] font-semibold transition-colors',
                      decision.className
                    )}
                  >
                    {t.house.decision[decision.type]}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                ))}
              </div>
              <p className="mt-5 text-[11.5px] leading-relaxed text-[#6f7a7f]">{t.lead.disclaimer}</p>
            </div>
          </aside>
        </div>
      </div>

      {/* STICKY MOBILE CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#1a2025]/95 p-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() =>
            openLead({ type: 'buyer_check', address: building.address, building_id: building.id })
          }
          className="flex min-h-[48px] w-full items-center justify-center gap-2 bg-[#eee7dc] text-[14px] font-semibold text-[#1a2025]"
        >
          {t.house.stickyCta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}