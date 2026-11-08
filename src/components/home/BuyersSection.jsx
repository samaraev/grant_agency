import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import { useLead } from '@/components/LeadProvider';
import { track } from '@/lib/track';
import { t } from '@/lib/i18n';

export default function BuyersSection() {
  const { openLead } = useLead();

  return (
    <section className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <SectionHeading
          marker={t.home.buyersBlock.marker}
          title={t.home.buyersBlock.title}
          subtitle={t.home.buyersBlock.subtitle}
        />
        <div>
          <ul className="grid gap-px bg-white/10">
            {t.home.buyersBlock.points.map((point) => (
              <li
                key={point}
                className="flex gap-3 bg-[#1a2025] py-4 text-[13.5px] leading-relaxed text-[#d7dcde]"
              >
                <span className="mt-[7px] h-[5px] w-[5px] shrink-0 bg-[#c9b28c]" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                track(t.track.ctaClick, { cta: 'home_buyer' });
                openLead({ type: 'buyer_buy', cluster: 'khamovniki' });
              }}
              className="flex min-h-[48px] items-center justify-center gap-2 bg-[#eee7dc] px-6 text-[13.5px] font-semibold text-[#1a2025] transition-colors hover:bg-white"
            >
              {t.home.buyersBlock.cta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <Link
              to="/pokupatelyam"
              className="flex min-h-[48px] items-center justify-center gap-2 border border-white/15 px-6 text-[13.5px] font-medium text-white transition-colors hover:border-[#c9b28c] hover:text-[#c9b28c]"
            >
              {t.home.buyersBlock.pageCta}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}