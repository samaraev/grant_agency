import SectionHeading from '@/components/SectionHeading';
import HelpCard from '@/components/home/HelpCard';
import { t } from '@/lib/i18n';

export default function HelpSection() {
  const h = t.homepage.help;

  return (
    <section className="border-b border-white/10">
      <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
        <SectionHeading marker={h.marker} title={h.title} subtitle={h.subtitle} />
        <div className="mt-12 grid gap-px bg-white/10 lg:grid-cols-2">
          <HelpCard data={h.owner} leadType="owner_appraise" trackingId="help_owner" />
          <HelpCard data={h.buyer} leadType="buyer_buy" trackingId="help_buyer" />
        </div>
      </div>
    </section>
  );
}