import PropertyCollection from '@/components/PropertyCollection';
import { PROPERTY_GROUPS } from '@/lib/price';
import { t } from '@/lib/i18n';

export default function PremiumCollections({ buildings = [] }) {
  const published = buildings.filter((item) => item.is_published !== false);
  const collect = (group) =>
    published.filter((item) => PROPERTY_GROUPS[group].includes(item.property_type));

  const offices = collect('offices');
  const residences = collect('residences');
  const estates = collect('estates');
  if (!offices.length && !residences.length && !estates.length) return null;

  return (
    <div className="border-t border-white/10 bg-[#1a2025]">
      <div className="mx-auto max-w-[1240px] px-5 pt-16 lg:px-8 lg:pt-20">
        <div className="eyebrow">{t.homepage.premium.marker}</div>
        <h2 className="mt-5 max-w-3xl font-heading text-[32px] leading-[1.08] text-white sm:text-[44px] lg:text-[50px]">
          {t.homepage.premium.title}{' '}
          <span className="italic text-[#c9b28c]">{t.homepage.premium.titleAccent}</span>
        </h2>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#b0b8bc]">
          {t.homepage.premium.subtitle}
        </p>
      </div>
      <PropertyCollection
        marker={t.home.collections.offices.marker}
        title={t.home.collections.offices.title}
        subtitle={t.home.collections.offices.subtitle}
        linkLabel={t.home.collections.offices.cta}
        linkTo="/search?group=offices"
        items={offices}
      />
      <PropertyCollection
        marker={t.home.collections.residences.marker}
        title={t.home.collections.residences.title}
        subtitle={t.home.collections.residences.subtitle}
        linkLabel={t.home.collections.residences.cta}
        linkTo="/search?group=residences"
        items={residences}
      />
      <PropertyCollection
        marker={t.home.collections.estates.marker}
        title={t.home.collections.estates.title}
        subtitle={t.home.collections.estates.subtitle}
        linkLabel={t.home.collections.estates.cta}
        linkTo="/search?group=estates"
        items={estates}
      />
    </div>
  );
}