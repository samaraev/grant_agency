import { ArrowRight, ArrowUpRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useLead } from '@/components/LeadProvider';
import { track } from '@/lib/track';
import { t } from '@/lib/i18n';

export default function ContactsSection({ settings }) {
  const c = t.homepage.contacts;
  const { openLead } = useLead();
  const phone = settings?.phone;
  const email = settings?.email;
  const address = settings?.office_address;
  const landmark = settings?.office_landmark;
  const hours = settings?.working_hours;
  const route = address
    ? `https://yandex.ru/maps/?text=${encodeURIComponent(`${address}, Москва`)}`
    : null;

  return (
    <section id="contacts" className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-24">
      <div className="relative overflow-hidden border border-white/10 bg-[#263033] p-6 sm:p-10 lg:p-14">
        <div className="pulse -right-[8%] -top-[40%] h-[420px] w-[420px]" aria-hidden="true" />
        <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <div className="eyebrow">{c.marker}</div>
            <h2 className="mt-5 font-heading text-[30px] leading-[1.1] text-white sm:text-[42px]">
              {c.title}
            </h2>
            <p className="mt-5 max-w-lg text-[14px] leading-relaxed text-[#b0b8bc]">{c.subtitle}</p>

            <button
              type="button"
              onClick={() => {
                track(t.track.ctaClick, { cta: 'contacts_enquiry' });
                openLead({ type: 'owner_appraise', cluster: 'khamovniki' });
              }}
              className="mt-7 inline-flex min-h-[50px] items-center gap-2 bg-[#eee7dc] px-6 text-[14px] font-semibold text-[#1a2025] transition-colors hover:bg-white"
            >
              {c.cta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="mt-9 space-y-3">
              {phone ? (
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                  onClick={() => track(t.track.phoneClick, { place: 'home-contacts' })}
                  className="flex items-center gap-3 text-[16px] text-white transition-colors hover:text-[#c9b28c]"
                >
                  <Phone className="h-4 w-4 text-[#c9b28c]" aria-hidden="true" />
                  {phone}
                </a>
              ) : null}
              {email ? (
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-3 text-[14px] text-[#d7dcde] transition-colors hover:text-[#c9b28c]"
                >
                  <Mail className="h-4 w-4 text-[#c9b28c]" aria-hidden="true" />
                  {email}
                </a>
              ) : null}
              {hours ? (
                <div className="flex items-center gap-3 text-[13px] text-[#8f9a9f]">
                  <Clock className="h-4 w-4 text-[#c9b28c]" aria-hidden="true" />
                  {hours}
                </div>
              ) : null}
            </div>
          </div>

          {address ? (
            <div className="border border-white/10 bg-[#1f272b] p-6 lg:p-8">
              <div className="eyebrow">{c.officeTitle}</div>
              <div className="mt-4 flex gap-3">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#c9b28c]" aria-hidden="true" />
                <div>
                  <p className="font-heading text-[22px] leading-snug text-white">{address}</p>
                  {landmark ? <p className="mt-2 text-[13px] text-[#8f9a9f]">{landmark}</p> : null}
                </div>
              </div>
              {route ? (
                <a
                  href={route}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex min-h-[44px] items-center gap-2 border border-white/15 px-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-[#c9b28c] hover:text-[#c9b28c]"
                >
                  {c.route}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}