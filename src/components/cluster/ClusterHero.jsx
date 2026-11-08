import { ArrowRight } from 'lucide-react';
import AddressSearch from '@/components/AddressSearch';
import { useLead } from '@/components/LeadProvider';
import { t } from '@/lib/i18n';

export default function ClusterHero({ buildings }) {
  const { openLead } = useLead();

  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="pulse -left-[20%] -top-[30%] h-[70vw] w-[70vw] max-w-[760px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <div className="eyebrow">{t.cluster.marker}</div>
          <h1 className="mt-5 text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-[44px] lg:text-[54px]">
            {t.cluster.title}
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#b0b8bc] sm:text-[17px]">
            {t.cluster.subtitle}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => openLead({ type: 'owner_sell', cluster: 'khamovniki' })}
            className="flex min-h-[48px] items-center gap-2 bg-[#c8102e] px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#a90d26]"
          >
            {t.cluster.heroCta}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="max-w-sm text-[12px] leading-relaxed text-[#778287]">{t.cluster.kpiNote}</span>
        </div>

        <div className="mt-10 max-w-[38rem]">
          <AddressSearch
            buildings={buildings}
            label={t.cluster.searchTitle}
            placeholder={t.home.hero.searchPlaceholder}
          />
        </div>
      </div>
    </section>
  );
}