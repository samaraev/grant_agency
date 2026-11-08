import { ArrowRight } from 'lucide-react';
import { useLead } from '@/components/LeadProvider';
import { track } from '@/lib/track';
import { t } from '@/lib/i18n';

export default function HelpCard({ data, leadType, cluster = 'khamovniki', trackingId }) {
  const { openLead } = useLead();

  return (
    <article className="flex flex-col bg-[#1a2025] p-6 sm:p-8 lg:p-10">
      <h3 className="max-w-[22rem] font-heading text-[26px] leading-[1.12] text-white sm:text-[32px]">
        {data.title}
      </h3>
      <p className="mt-4 text-[14px] leading-relaxed text-[#b0b8bc]">{data.text}</p>

      <ol className="mt-7 grid gap-px bg-white/10">
        {data.items.map((item) => (
          <li key={item.number} className="flex gap-4 bg-[#1a2025] py-4">
            <span className="pt-0.5 font-mono text-[11px] tracking-[0.16em] text-[#c8102e]">
              {item.number}
            </span>
            <div>
              <div className="text-[15px] font-semibold text-white">{item.title}</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#b0b8bc]">{item.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={() => {
          track(t.track.ctaClick, { cta: trackingId });
          openLead({ type: leadType, cluster });
        }}
        className="mt-7 inline-flex min-h-[46px] w-full items-center justify-center gap-2 border border-[#c9b28c]/50 px-5 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-[#c9b28c] transition-colors hover:bg-[#c9b28c] hover:text-[#1a2025] sm:w-auto sm:self-start"
      >
        {data.cta}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </article>
  );
}