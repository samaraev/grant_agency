import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import { useLead } from '@/components/LeadProvider';
import { base44 } from '@/api/base44Client';
import { applySeo } from '@/lib/seo';
import { track } from '@/lib/track';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const AUDIENCE_LABEL = { owner: 'forOwner', buyer: 'forBuyer', all: 'audienceAll' };

function ServiceRow({ service, onCta }) {
  const planned = service.status === 'planned';
  return (
    <div
      className={cn(
        'flex flex-col gap-4 border border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between',
        planned ? 'bg-[#1f272b]' : 'bg-[#263033]'
      )}
    >
      <div className="max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'px-2 py-1 text-[10px] uppercase tracking-[0.18em]',
              planned ? 'bg-white/10 text-[#b0b8bc]' : 'bg-[#c8102e] text-white'
            )}
          >
            {planned ? t.services.statusPlanned : t.services.statusActive}
          </span>
          <span className="text-[10.5px] uppercase tracking-[0.18em] text-[#778287]">
            {t.services[AUDIENCE_LABEL[service.audience] || 'audienceAll']}
          </span>
        </div>
        <h3 className="mt-3 text-[19px] font-bold text-white">{service.title}</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#b0b8bc]">{service.short_description}</p>
        {planned ? (
          <p className="mt-3 text-[11.5px] text-[#778287]">{t.services.plannedNote}</p>
        ) : null}
      </div>
      {!planned ? (
        <button
          type="button"
          onClick={onCta}
          className="flex min-h-[44px] shrink-0 items-center gap-2 border border-white/15 px-4 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:border-[#c8102e] hover:bg-[#c8102e]"
        >
          {t.nav.cta}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export default function Services() {
  const { openLead } = useLead();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cleanup = applySeo({ ...t.meta.services, path: '/uslugi' });
    track(t.track.pageView, { page: 'services' });
    base44.entities.Service.list({ sort: 'sort_order', limit: 50 })
      .then((page) => setServices(page?.items || []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
    return cleanup;
  }, []);

  const active = services.filter((item) => item.status !== 'planned');
  const planned = services.filter((item) => item.status === 'planned');

  return (
    <div>
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-20">
          <div className="eyebrow">{t.services.marker}</div>
          <h1 className="mt-5 max-w-3xl text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-[44px] lg:text-[54px]">
            {t.services.title}
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#b0b8bc] sm:text-[17px]">
            {t.services.subtitle}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-16">
        <h2 className="text-[22px] font-bold text-white">{t.services.activeTitle}</h2>
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="h-28 animate-pulse border border-white/10 bg-[#263033]" />
          ) : active.length ? (
            active.map((service) => (
              <ServiceRow
                key={service.id}
                service={service}
                onCta={() => openLead({ type: service.audience === 'buyer' ? 'buyer_buy' : 'owner_appraise' })}
              />
            ))
          ) : (
            <p className="text-[14px] text-[#8f9a9f]">{t.services.empty}</p>
          )}
        </div>

        {planned.length ? (
          <>
            <h2 className="mt-14 text-[22px] font-bold text-white">{t.services.plannedTitle}</h2>
            <p className="mt-2 max-w-2xl text-[13px] text-[#8f9a9f]">{t.services.plannedNote}</p>
            <div className="mt-6 space-y-4">
              {planned.map((service) => (
                <ServiceRow key={service.id} service={service} onCta={() => {}} />
              ))}
            </div>
          </>
        ) : null}
      </section>

      <section className="border-t border-white/10 bg-[#1f272b]">
        <div className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-20">
          <SectionHeading
            marker={t.services.roadmap.marker}
            title={t.services.roadmap.title}
            subtitle={t.services.roadmap.subtitle}
          />
          <ol className="mt-10 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {t.services.roadmap.stages.map((stage) => (
              <li key={stage.num} className="bg-[#1f272b] p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[20px] text-[#c8102e]">{stage.num}</span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[#778287]">
                    {stage.status}
                  </span>
                </div>
                <h3 className="mt-3 text-[16px] font-bold text-white">{stage.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[#b0b8bc]">{stage.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}