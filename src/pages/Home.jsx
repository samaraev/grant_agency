import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Image } from '@/components/ui/image';
import AddressSearch from '@/components/AddressSearch';
import BuildingCard from '@/components/BuildingCard';
import BuildingsMap from '@/components/BuildingsMap';
import PropertyCollection from '@/components/PropertyCollection';
import SectionHeading from '@/components/SectionHeading';
import { PROPERTY_GROUPS } from '@/lib/price';
import { useLead } from '@/components/LeadProvider';
import { useLang } from '@/components/LanguageProvider';
import { useBuildingList } from '@/hooks/useBuildings';
import { HERO_IMAGE } from '@/lib/sample-buildings';
import { applySeo, organizationJsonLd } from '@/lib/seo';
import { track } from '@/lib/track';
import { t } from '@/lib/i18n';

export default function Home() {
  const { buildings } = useBuildingList();
  const published = buildings.filter((item) => item.is_published !== false);
  const featured = published
    .filter((item) => (item.property_type || 'residential') === 'residential')
    .slice(0, 6);
  const collect = (group) =>
    published.filter((item) => PROPERTY_GROUPS[group].includes(item.property_type));
  const { openLead } = useLead();
  const { lang } = useLang();

  useEffect(() => {
    const cleanup = applySeo({
      ...t.meta.home,
      path: '/',
      image: HERO_IMAGE,
      jsonLd: organizationJsonLd(t.settings),
    });
    return cleanup;
  }, [lang]);

  useEffect(() => {
    track(t.track.pageView, { page: 'home' });
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="pulse -right-[18%] -top-[28%] h-[78vw] w-[78vw] max-h-[820px] max-w-[820px]"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-[1240px] gap-12 px-5 pb-16 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="fade-up">
            <div className="eyebrow">{t.home.hero.marker}</div>
            <h1 className="mt-6 font-heading text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-white sm:text-[54px] lg:text-[72px]">
              {t.home.hero.titleLead}
              <br className="hidden sm:block" /> {t.home.hero.titleTail}{' '}
              <span className="whitespace-nowrap text-[#c9b28c]">{t.home.hero.titleAccent}</span>
            </h1>
            <p className="mt-6 max-w-[34rem] text-[15px] leading-relaxed text-[#b0b8bc] sm:text-[17px]">
              {t.home.hero.subtitle}
            </p>

            <div className="mt-9 max-w-[36rem]">
              <AddressSearch
                buildings={published}
                label={t.home.hero.searchLabel}
                placeholder={t.home.hero.searchPlaceholder}
              />
              <p className="mt-3 text-[12px] text-[#778287]">{t.home.hero.searchHint}</p>
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/sobstvennikam"
                onClick={() => track(t.track.ctaClick, { cta: 'hero_owner' })}
                className="flex min-h-[48px] items-center justify-center gap-2 bg-[#eee7dc] px-6 text-[14px] font-semibold text-[#1a2025] transition-colors hover:bg-white"
              >
                {t.home.hero.primaryCta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/search"
                className="flex min-h-[48px] items-center justify-center gap-2 border border-white/15 px-6 text-[14px] font-medium text-white transition-colors hover:border-[#c9b28c] hover:text-[#c9b28c]"
              >
                {t.home.hero.secondaryCta}
              </Link>
            </div>

            <p className="mt-8 max-w-[30rem] border-l-2 border-[#c8102e] pl-4 text-[13px] leading-relaxed text-[#d7dcde]">
              {t.home.hero.trustLine}
            </p>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden border border-white/10 bg-[#1f272b] lg:aspect-[5/6]">
              <Image
                src={HERO_IMAGE}
                alt={t.home.hero.imageAlt}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a2025] via-[#1a2025]/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-5">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#c9b28c]">
                    {published.length} {t.home.hero.addressesInDb}
                  </div>
                  <div className="mt-1 text-[14px] font-medium text-white">{t.home.hero.coverage}</div>
                </div>
                <span className="text-[11px] text-[#b0b8bc]">{t.home.hero.coverCaption}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST CARDS */}
      <section className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="eyebrow mb-8">{t.home.trust.marker}</div>
        <div className="grid gap-px bg-white/10 sm:grid-cols-3">
          {t.home.trust.items.map((item, index) => (
            <div key={item.title} className="bg-[#1a2025] p-6 lg:p-8">
              <div className="font-mono text-[11px] tracking-[0.2em] text-[#c8102e]">
                0{index + 1}
              </div>
              <h3 className="mt-4 text-[19px] font-bold text-white">{item.title}</h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-[#b0b8bc]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FLOW */}
      <section className="border-y border-white/10 bg-[#1f272b]">
        <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
          <SectionHeading
            marker={t.home.flow.marker}
            title={t.home.flow.title}
            subtitle={t.home.flow.subtitle}
          />
          <ol className="mt-12 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {t.home.flow.steps.map((step, index) => (
              <li key={step.num} className="relative bg-[#1f272b] p-6 lg:p-7">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[22px] font-medium text-[#c8102e]">{step.num}</span>
                  {index < t.home.flow.steps.length - 1 ? (
                    <ArrowRight className="hidden h-4 w-4 text-white/25 lg:block" aria-hidden="true" />
                  ) : null}
                </div>
                <h3 className="mt-4 text-[17px] font-bold uppercase tracking-[0.06em] text-white">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-[#b0b8bc]">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            marker={t.home.featured.marker}
            title={t.home.featured.title}
            subtitle={t.home.featured.subtitle}
          />
          <Link
            to="/search"
            className="flex shrink-0 items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#c9b28c] transition-colors hover:text-white"
          >
            {t.common.allHouses}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((building) => (
            <BuildingCard key={building.id} building={building} />
          ))}
        </div>
      </section>

      {/* COLLECTIONS */}
      <PropertyCollection
        marker={t.home.collections.offices.marker}
        title={t.home.collections.offices.title}
        subtitle={t.home.collections.offices.subtitle}
        linkLabel={t.home.collections.offices.cta}
        linkTo="/search?group=offices"
        items={collect('offices')}
      />
      <PropertyCollection
        marker={t.home.collections.residences.marker}
        title={t.home.collections.residences.title}
        subtitle={t.home.collections.residences.subtitle}
        linkLabel={t.home.collections.residences.cta}
        linkTo="/search?group=residences"
        items={collect('residences')}
      />
      <PropertyCollection
        marker={t.home.collections.estates.marker}
        title={t.home.collections.estates.title}
        subtitle={t.home.collections.estates.subtitle}
        linkLabel={t.home.collections.estates.cta}
        linkTo="/search?group=estates"
        items={collect('estates')}
      />

      {/* MAP */}
      <section className="border-y border-white/10 bg-[#1f272b]">
        <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
          <SectionHeading
            marker={t.home.map.marker}
            title={t.home.map.title}
            subtitle={t.home.map.subtitle}
          />
          <div className="mt-10">
            <BuildingsMap
              buildings={published}
              onContact={(building) =>
                openLead({ type: 'buyer_check', address: building.address, building_id: building.id })
              }
            />
          </div>
        </div>
      </section>

      {/* AUDIENCES */}
      <section className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
        <SectionHeading
          marker={t.home.audiences.marker}
          title={t.home.audiences.title}
          subtitle={t.home.audiences.subtitle}
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {[
            { key: 'owner', data: t.home.audiences.owner, to: '/sobstvennikam' },
            { key: 'buyer', data: t.home.audiences.buyer, to: '/pokupatelyam' },
          ].map(({ key, data, to }) => (
            <div key={key} className="flex flex-col border border-white/10 bg-[#263033] p-6 lg:p-8">
              <h3 className="text-[24px] font-bold text-white">{data.title}</h3>
              <p className="mt-2 text-[13.5px] text-[#b0b8bc]">{data.text}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {data.questions.map((question) => (
                  <li key={question} className="flex gap-3 text-[13.5px] leading-relaxed text-[#d7dcde]">
                    <span className="mt-[7px] h-[5px] w-[5px] shrink-0 bg-[#c8102e]" aria-hidden="true" />
                    {question}
                  </li>
                ))}
              </ul>
              <Link
                to={to}
                onClick={() => track(t.track.ctaClick, { cta: `audience_${key}` })}
                className="mt-8 flex min-h-[46px] items-center justify-between gap-3 border border-white/15 px-5 text-[13px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-[#c8102e] hover:bg-[#c8102e]"
              >
                {data.cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FOUNDATION */}
      <section className="border-t border-white/10 bg-[#1f272b]">
        <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
          <SectionHeading
            marker={t.home.foundation.marker}
            title={t.home.foundation.title}
            subtitle={t.home.foundation.subtitle}
          />
          <div className="mt-12 grid gap-px bg-white/10 sm:grid-cols-2">
            {t.home.foundation.items.map((item) => (
              <div key={item.title} className="bg-[#1f272b] p-6 lg:p-8">
                <h3 className="flex items-center gap-3 text-[17px] font-bold text-white">
                  <span className="h-4 w-[2px] bg-[#c8102e]" aria-hidden="true" />
                  {item.title}
                </h3>
                <p className="mt-3 pl-[14px] text-[13.5px] leading-relaxed text-[#b0b8bc]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-24">
        <div className="relative overflow-hidden border border-white/10 bg-[#263033] p-8 lg:p-14">
          <div className="pulse -right-[10%] -top-[40%] h-[420px] w-[420px]" aria-hidden="true" />
          <div className="relative max-w-2xl">
            <div className="eyebrow">{t.home.hero.marker}</div>
            <h2 className="mt-4 text-[26px] font-bold leading-tight text-white sm:text-[36px]">
              {t.home.finalCta.title}
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-[#b0b8bc]">
              {t.lead.disclaimer}
            </p>
            <Link
              to="/sobstvennikam"
              onClick={() => track(t.track.ctaClick, { cta: 'final_owner' })}
              className="mt-7 inline-flex min-h-[48px] items-center gap-2 bg-[#eee7dc] px-6 text-[14px] font-semibold text-[#1a2025] transition-colors hover:bg-white"
            >
              {t.home.hero.primaryCta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}