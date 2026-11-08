import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/image';
import SectionHeading from '@/components/SectionHeading';
import { propertyTypeLabel } from '@/lib/price';
import { t } from '@/lib/i18n';

export default function KnowledgeSection({ buildings = [] }) {
  const examples = buildings.slice(0, 3);

  return (
    <section className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
      <SectionHeading
        marker={t.home.knowledge.marker}
        title={t.home.knowledge.title}
        subtitle={t.home.knowledge.subtitle}
      />

      <div className="mt-12 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
        {t.home.knowledge.factors.map((factor, index) => (
          <div key={factor.title} className="bg-[#1a2025] p-6 lg:p-7">
            <div className="font-mono text-[11px] tracking-[0.2em] text-[#c8102e]">
              {String(index + 1).padStart(2, '0')}
            </div>
            <h3 className="mt-3 text-[17px] font-bold text-white">{factor.title}</h3>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#b0b8bc]">{factor.text}</p>
          </div>
        ))}
      </div>

      {examples.length ? (
        <div className="mt-14">
          <h3 className="font-heading text-[26px] text-white sm:text-[30px]">
            {t.home.knowledge.examplesTitle}
          </h3>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {examples.map((building) => (
              <Link
                key={building.id}
                to={`/house/${building.id}`}
                className="group flex gap-4 border border-white/10 bg-[#263033] p-4 transition-colors hover:border-[#c8102e]/60"
              >
                <div className="h-[92px] w-[92px] shrink-0 overflow-hidden bg-[#1f272b]">
                  {building.photos?.[0] ? (
                    <Image
                      src={building.photos[0]}
                      alt={`${t.common.photoAlt} ${building.address}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold leading-snug text-white">
                    {building.address}
                  </div>
                  <div className="mt-1.5 text-[11.5px] uppercase tracking-[0.12em] text-[#778287]">
                    {[propertyTypeLabel(building), building.series_or_type, building.year_built]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#c9b28c]">
                    {t.home.knowledge.open}
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-5 max-w-3xl text-[12px] leading-relaxed text-[#778287]">
            {t.home.knowledge.note}
          </p>
        </div>
      ) : null}
    </section>
  );
}