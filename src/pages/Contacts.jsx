import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import LeadForm from '@/components/LeadForm';
import { applySeo, organizationJsonLd } from '@/lib/seo';
import { track } from '@/lib/track';
import { t } from '@/lib/i18n';

const OFFICE = [54.1938, 37.6178];

export default function Contacts() {
  const { settings } = useOutletContext() || {};

  useEffect(() => {
    const cleanup = applySeo({
      ...t.meta.contacts,
      path: '/kontakty',
      jsonLd: organizationJsonLd(settings || t.settings),
    });
    track(t.track.pageView, { page: 'contacts' });
    return cleanup;
  }, [settings]);

  const info = settings || t.settings;

  return (
    <div>
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-20">
          <div className="eyebrow">{t.contacts.marker}</div>
          <h1 className="mt-5 text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-[44px] lg:text-[54px]">
            {t.contacts.title}
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#b0b8bc] sm:text-[17px]">
            {t.contacts.subtitle}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-8 lg:py-20">
        <div>
          <ul className="space-y-6 text-[14px] text-[#d7dcde]">
            <li className="flex gap-3.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#f4a7b0]" aria-hidden="true" />
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.18em] text-[#778287]">
                  {t.common.phone}
                </div>
                <a
                  href={`tel:${String(info.phone).replace(/[^\d+]/g, '')}`}
                  className="mt-1 block text-[17px] font-semibold text-white hover:text-[#f4a7b0]"
                >
                  {info.phone}
                </a>
              </div>
            </li>
            <li className="flex gap-3.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#f4a7b0]" aria-hidden="true" />
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.18em] text-[#778287]">
                  {t.common.email}
                </div>
                <a href={`mailto:${info.email}`} className="mt-1 block text-white hover:text-[#f4a7b0]">
                  {info.email}
                </a>
              </div>
            </li>
            <li className="flex gap-3.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#f4a7b0]" aria-hidden="true" />
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.18em] text-[#778287]">
                  {t.common.office}
                </div>
                <div className="mt-1 text-white">{info.office_address}</div>
                <div className="mt-1 text-[12.5px] text-[#8f9a9f]">
                  {t.common.landmark}: {info.office_landmark}
                </div>
              </div>
            </li>
            <li className="flex gap-3.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#f4a7b0]" aria-hidden="true" />
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.18em] text-[#778287]">
                  {t.common.hours}
                </div>
                <div className="mt-1 text-white">{info.working_hours}</div>
              </div>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { href: info.telegram, label: 'Telegram' },
              { href: info.whatsapp, label: 'WhatsApp' },
              { href: info.vk, label: 'ВКонтакте' },
            ]
              .filter((link) => link.href)
              .map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex min-h-[40px] items-center border border-white/15 px-4 text-[12.5px] text-[#d7dcde] transition-colors hover:border-[#f4a7b0] hover:text-white"
                >
                  {link.label}
                </a>
              ))}
          </div>

          <div className="mt-8 h-[280px] overflow-hidden border border-white/10">
            <MapContainer center={OFFICE} zoom={16} scrollWheelZoom={false} className="h-full w-full">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <CircleMarker
                center={OFFICE}
                radius={10}
                pathOptions={{ color: '#c8102e', fillColor: '#c8102e', fillOpacity: 0.95, weight: 2 }}
              >
                <Tooltip direction="top" offset={[0, -6]}>
                  {info.office_address}
                </Tooltip>
              </CircleMarker>
            </MapContainer>
          </div>
        </div>

        <div className="border border-white/10 bg-[#263033] p-5 sm:p-7">
          <div className="eyebrow">{t.contacts.marker}</div>
          <h2 className="mb-5 mt-3 text-[22px] font-bold text-white">{t.contacts.formTitle}</h2>
          <LeadForm defaultType="general" />
        </div>
      </section>
    </div>
  );
}