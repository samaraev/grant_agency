import { Link } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';
import { Image } from '@/components/ui/image';
import AddressSearch from '@/components/AddressSearch';
import { useLead } from '@/components/LeadProvider';
import { HERO_IMAGE } from '@/lib/sample-buildings';
import { track } from '@/lib/track';
import { t } from '@/lib/i18n';

export default function KhamovnikiHero({ buildings = [], settings, cover }) {
  const { openLead } = useLead();
  const c = t.homepage.hero;
  const phone = settings?.phone;
  const photo = cover?.photos?.[0] || HERO_IMAGE;

  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div
        className="pulse -right-[16%] -top-[26%] h-[76vw] w-[76vw] max-h-[780px] max-w-[780px]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1240px] px-5 pb-14 pt-10 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-start lg:gap-14">
          <div className="fade-up">
            <div className="eyebrow">{c.marker}</div>
            <h1 className="mt-6 font-heading text-[40px] leading-[1.04] tracking-[-0.02em] text-white sm:text-[54px] lg:text-[62px]">
              {c.title}
              <span className="mt-1 block italic text-[#c9b28c]">{c.titleAccent}</span>
            </h1>
            <p className="mt-7 max-w-[34rem] text-[16px] leading-relaxed text-[#e6eaec] sm:text-[18px]">
              {c.subtitle}
            </p>
            <p className="mt-3 max-w-[34rem] text-[14px] leading-relaxed text-[#b0b8bc]">{c.text}</p>

            <div className="mt-8 max-w-[34rem]">
              <AddressSearch
                buildings={buildings}
                label={c.searchLabel}
                placeholder={c.searchPlaceholder}
              />
              <p className="mt-3 text-[12px] text-[#778287]">{c.searchHint}</p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  track(t.track.ctaClick, { cta: 'hero_owner' });
                  openLead({ type: 'owner_appraise', cluster: 'khamovniki' });
                }}
                className="flex min-h-[50px] items-center justify-center gap-2 bg-[#eee7dc] px-6 text-[14px] font-semibold text-foreground transition-colors hover:bg-white"
              >
                {c.primaryCta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  track(t.track.ctaClick, { cta: 'hero_buyer' });
                  openLead({ type: 'buyer_buy', cluster: 'khamovniki' });
                }}
                className="flex min-h-[50px] items-center justify-center gap-2 border border-white/20 px-6 text-[14px] font-medium text-white transition-colors hover:border-[#c9b28c] hover:text-[#c9b28c]"
              >
                {c.secondaryCta}
              </button>
              <a
                href="#homepage-buildings"
                className="flex min-h-[50px] items-center justify-center gap-2 border border-white/20 px-6 text-[14px] font-medium text-white transition-colors hover:border-[#c9b28c] hover:text-[#c9b28c]"
              >
                {c.catalogCta}
              </a>
            </div>

            {phone ? (
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                  onClick={() => track(t.track.phoneClick, { place: 'home-hero' })}
                  className="flex items-center gap-2.5 font-heading text-[24px] leading-none text-white transition-colors hover:text-[#c9b28c]"
                >
                  <Phone className="h-4 w-4 text-[#c9b28c]" aria-hidden="true" />
                  {phone}
                </a>
                <span className="text-[12px] text-[#8f9a9f]">{c.phoneHint}</span>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden border border-white/10 bg-[#1f272b] lg:aspect-[4/5]">
              <Image src={photo} alt={c.imageAlt} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a2025] via-transparent to-transparent" />
              {cover ? (
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#c9b28c]">
                    {c.coverCaption}
                  </div>
                  <Link
                    to={`/house/${cover.id}`}
                    className="mt-2 flex items-center gap-2 text-[14px] font-medium text-white transition-colors hover:text-[#c9b28c]"
                  >
                    {cover.address}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              ) : null}
            </div>
            <div className="mt-3 flex items-baseline gap-4 border border-white/10 px-4 py-3">
              <span className="font-heading text-[24px] leading-none text-[#c9b28c]">{c.since}</span>
              <span className="text-[12px] leading-relaxed text-[#8f9a9f]">{c.sinceText}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}