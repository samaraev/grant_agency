import SectionHeading from '@/components/SectionHeading';
import { t } from '@/lib/i18n';

export default function ClusterProcess() {
  return (
    <section className="border-y border-white/10 bg-[#1f272b]">
      <div className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-20">
        <SectionHeading marker={t.cluster.process.marker} title={t.cluster.process.title} />
        <ol className="mt-10 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {t.cluster.process.steps.map((step, index) => (
            <li key={step.title} className="bg-[#1f272b] p-6">
              <div className="font-mono text-[20px] text-[#c8102e]">0{index + 1}</div>
              <h3 className="mt-3 text-[16px] font-bold uppercase tracking-[0.06em] text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#b0b8bc]">{step.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-3xl border-l-2 border-[#c8102e] pl-4 text-[13px] leading-relaxed text-[#d7dcde]">
          {t.cluster.process.note}
        </p>
      </div>
    </section>
  );
}