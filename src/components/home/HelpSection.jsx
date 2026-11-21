import { ArrowRight } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import { useLead } from '@/components/LeadProvider';
import { track } from '@/lib/track';
import { t } from '@/lib/i18n';

export default function HelpSection() {
  const h = t.homepage.help;
  const { openLead } = useLead();

  return (
    <section className="border-b border-white/10">
      <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
        <SectionHeading marker={h.marker} title={h.title} subtitle={h.subtitle} />
        <p className="mt-8 max-w-3xl text-[14px] leading-relaxed text-[#b0b8bc]">{h.owner.text}</p>
        <div className="mt-8 grid gap-px bg-white/10 md:grid-cols-3">
          {h.owner.items.map((item) => (
            <article key={item.number} className="bg-[#1a2025] p-6 lg:p-7">
              <div className="font-mono text-[11px] tracking-[0.2em] text-[#c8102e]">
                {item.number}
              </div>
              <h3 className="mt-3 text-[17px] font-bold text-white">{item.title}</h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#b0b8bc]">{item.text}</p>
            </article>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            track(t.track.ctaClick, { cta: 'help_owner' });
            openLead({ type: 'owner_appraise', cluster: 'khamovniki' });
          }}
          className="mt-7 inline-flex min-h-[46px] items-center justify-center gap-2 border border-[#c9b28c]/50 px-5 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-[#c9b28c] transition-colors hover:bg-[#c9b28c] hover:text-[#1a2025]"
        >
          {h.owner.cta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}