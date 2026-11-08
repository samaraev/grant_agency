import SectionHeading from '@/components/SectionHeading';
import { t } from '@/lib/i18n';

export default function ClusterReasons() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-20">
      <SectionHeading marker={t.cluster.reasonsMarker} title={t.cluster.reasonsTitle} />
      <div className="mt-10 grid gap-px bg-white/10 sm:grid-cols-2">
        {t.cluster.reasons.map((item, index) => (
          <div key={item.title} className="bg-[#1a2025] p-6 lg:p-7">
            <div className="font-mono text-[11px] tracking-[0.2em] text-[#c8102e]">
              {String(index + 1).padStart(2, '0')}
            </div>
            <h3 className="mt-3 text-[17px] font-bold text-white">{item.title}</h3>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#b0b8bc]">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}