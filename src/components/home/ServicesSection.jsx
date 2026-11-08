import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useLead } from '@/components/LeadProvider';
import { track } from '@/lib/track';
import { t } from '@/lib/i18n';

const LEAD_TYPES = ['owner_appraise', 'buyer_buy', 'general'];

export default function ServicesSection() {
  const { openLead } = useLead();
  const s = t.homepage.directions;

  return (
    <section className="border-b border-white/10">
      <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="eyebrow">{s.marker}</div>
        <h2 className="mt-5 max-w-3xl font-heading text-[32px] leading-[1.08] text-white sm:text-[44px] lg:text-[50px]">
          {s.title} <span className="italic text-[#c9b28c]">{s.titleAccent}</span>
        </h2>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#b0b8bc]">{s.subtitle}</p>

        <div className="mt-12 grid gap-px bg-white/10 lg:grid-cols-3">
          {s.items.map((item, index) => (
            <article key={item.number} className="flex flex-col bg-[#1a2025] p-6 lg:p-8">
              <div className="font-mono text-[11px] tracking-[0.2em] text-[#c8102e]">{item.number}</div>
              <h3 className="mt-3 font-heading text-[24px] leading-tight text-white sm:text-[28px]">
                {item.title}
              </h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-[#b0b8bc]">{item.text}</p>
              <button
                type="button"
                onClick={() => {
                  track(t.track.ctaClick, { cta: `direction_${index}` });
                  openLead({ type: LEAD_TYPES[index], cluster: 'khamovniki' });
                }}
                className="mt-6 inline-flex min-h-[44px] items-center gap-2 self-start text-[12px] font-semibold uppercase tracking-[0.14em] text-[#c9b28c] transition-colors hover:text-white"
              >
                {item.cta}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>

        <div className="mt-12 grid gap-6 border-t border-white/10 pt-8 lg:grid-cols-[0.6fr_1.4fr]">
          <div>
            <div className="eyebrow">{s.widerTitle}</div>
            <Link
              to="/uslugi"
              className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#c9b28c] transition-colors hover:text-white"
            >
              {s.all}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div>
            <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {s.wider.map((item) => (
                <li key={item} className="flex gap-3 py-1 text-[13.5px] leading-relaxed text-[#d7dcde]">
                  <span className="mt-[8px] h-[4px] w-[4px] shrink-0 bg-[#c9b28c]" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[12px] leading-relaxed text-[#778287]">{s.widerNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}