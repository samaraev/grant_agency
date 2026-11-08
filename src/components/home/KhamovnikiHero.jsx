import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MessageCircle, Phone, Send } from 'lucide-react';
import { Image } from '@/components/ui/image';
import AddressSearch from '@/components/AddressSearch';
import { useLead } from '@/components/LeadProvider';
import { HERO_IMAGE } from '@/lib/sample-buildings';
import { track } from '@/lib/track';
import { t } from '@/lib/i18n';

export default function KhamovnikiHero({ buildings = [], settings }) {
  const { openLead } = useLead();
  const withPhoto = buildings.filter((item) => item.photos?.length);
  const cover = (withPhoto.find((item) => item.is_priority) || withPhoto[0])?.photos[0] || HERO_IMAGE;
  const hours = settings?.working_hours || t.home.hero.hours;

  const contactLink =
    'flex min-h-[44px] items-center gap-2 border border-white/15 px-3 text-[12.5px] text-[#d7dcde] transition-colors hover:border-[#c9b28c] hover:text-[#c9b28c]';

  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div
        className="pulse -right-[18%] -top-[28%] h-[78vw] w-[78vw] max-h-[820px] max-w-[820px]"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-[1240px] gap-12 px-5 pb-16 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="fade-up">
          <div className="eyebrow">{t.home.hero.marker}</div>
          <h1 className="mt-6 font-heading text-[38px] font-medium leading-[1.06] tracking-[-0.02em] text-white sm:text-[50px] lg:text-[62px]">
            {t.home.hero.title}
          </h1>
          <p className="mt-6 max-w-[36rem] text-[15px] leading-relaxed text-[#b0b8bc] sm:text-[17px]">
            {t.home.hero.subtitle}
          </p>

          <div className="mt-9 max-w-[36rem]">
            <AddressSearch
              buildings={buildings}
              label={t.home.hero.searchLabel}
              placeholder={t.home.hero.searchPlaceholder}
            />
            <p className="mt-3 text-[12px] text-[#778287]">{t.home.hero.searchHint}</p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => {
                track(t.track.ctaClick, { cta: 'hero_owner_review' });
                openLead({ type: 'owner_appraise', cluster: 'khamovniki' });
              }}
              className="flex min-h-[50px] items-center justify-center gap-2 bg-[#eee7dc] px-6 text-[14px] font-semibold text-[#1a2025] transition-colors hover:bg-white"
            >
              {t.home.hero.primaryCta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <Link
              to="/search"
              className="flex min-h-[50px] items-center justify-center gap-2 border border-white/15 px-6 text-[14px] font-medium text-white transition-colors hover:border-[#c9b28c] hover:text-[#c9b28c]"
            >
              {t.home.hero.secondaryCta}
            </Link>
          </div>

          <div className="mt-9">
            <div className="eyebrow mb-3">{t.home.hero.contactsLabel}</div>
            <div className="flex flex-wrap items-center gap-2">
              {settings?.phone ? (
                <a
                  href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}
                  onClick={() => track(t.track.phoneClick, { place: 'home-hero' })}
                  className={contactLink}
                >
                  <Phone className="h-3.5 w-3.5 text-[#c9b28c]" aria-hidden="true" />
                  {settings.phone}
                </a>
              ) : null}
              {settings?.telegram ? (
                <a
                  href={settings.telegram}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track(t.track.telegramClick, { place: 'home-hero' })}
                  className={contactLink}
                >
                  <Send className="h-3.5 w-3.5 text-[#c9b28c]" aria-hidden="true" />
                  {t.home.hero.telegramLabel}
                </a>
              ) : null}
              {settings?.whatsapp ? (
                <a
                  href={settings.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track(t.track.whatsappClick, { place: 'home-hero' })}
                  className={contactLink}
                >
                  <MessageCircle className="h-3.5 w-3.5 text-[#c9b28c]" aria-hidden="true" />
                  {t.home.hero.whatsappLabel}
                </a>
              ) : null}
              <span className={`${contactLink} cursor-default hover:border-white/15 hover:text-[#d7dcde]`}>
                <Clock className="h-3.5 w-3.5 text-[#c9b28c]" aria-hidden="true" />
                {hours}
              </span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/3] w-full overflow-hidden border border-white/10 bg-[#1f272b] lg:aspect-[5/6]">
            <Image src={cover} alt={t.home.hero.imageAlt} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a2025] via-[#1a2025]/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-5">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#c9b28c]">
                  {buildings.length} {t.home.hero.addressesInDb}
                </div>
                <div className="mt-1 text-[14px] font-medium text-white">{t.home.hero.coverage}</div>
              </div>
              <span className="text-[11px] text-[#b0b8bc]">{t.home.hero.coverCaption}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}