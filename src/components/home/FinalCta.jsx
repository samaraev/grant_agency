import { ArrowRight } from 'lucide-react';
import { useLead } from '@/components/LeadProvider';
import { track } from '@/lib/track';
import { t } from '@/lib/i18n';

export default function FinalCta() {
  const { openLead } = useLead();

  return (
    <section className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-24">
      <div className="relative overflow-hidden border border-white/10 bg-[#263033] p-8 lg:p-14">
        <div className="pulse -right-[10%] -top-[40%] h-[420px] w-[420px]" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <div className="eyebrow">{t.home.hero.marker}</div>
          <h2 className="mt-4 font-heading text-[26px] leading-tight text-white sm:text-[36px]">
            {t.home.finalCta.title}
          </h2>
          <p className="mt-4 text-[14px] leading-relaxed text-[#b0b8bc]">{t.lead.disclaimer}</p>
          <button
            type="button"
            onClick={() => {
              track(t.track.ctaClick, { cta: 'final_owner_review' });
              openLead({ type: 'owner_appraise', cluster: 'khamovniki' });
            }}
            className="mt-7 inline-flex min-h-[48px] items-center gap-2 bg-[#eee7dc] px-6 text-[14px] font-semibold text-[#1a2025] transition-colors hover:bg-white"
          >
            {t.home.finalCta.cta}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}