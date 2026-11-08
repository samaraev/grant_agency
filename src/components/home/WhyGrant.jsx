import SectionHeading from '@/components/SectionHeading';
import { t } from '@/lib/i18n';

export default function WhyGrant() {
  return (
    <>
      <section className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="eyebrow mb-8">{t.home.trust.marker}</div>
        <div className="grid gap-px bg-white/10 sm:grid-cols-3">
          {t.home.trust.items.map((item, index) => (
            <div key={item.title} className="bg-[#1a2025] p-6 lg:p-8">
              <div className="font-mono text-[11px] tracking-[0.2em] text-[#c8102e]">
                0{index + 1}
              </div>
              <h3 className="mt-4 text-[19px] font-bold text-white">{item.title}</h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-[#b0b8bc]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#1f272b]">
        <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
          <SectionHeading
            marker={t.home.foundation.marker}
            title={t.home.foundation.title}
            subtitle={t.home.foundation.subtitle}
          />
          <div className="mt-12 grid gap-px bg-white/10 sm:grid-cols-2">
            {t.home.foundation.items.map((item) => (
              <div key={item.title} className="bg-[#1f272b] p-6 lg:p-8">
                <h3 className="flex items-center gap-3 text-[17px] font-bold text-white">
                  <span className="h-4 w-[2px] bg-[#c8102e]" aria-hidden="true" />
                  {item.title}
                </h3>
                <p className="mt-3 pl-[14px] text-[13.5px] leading-relaxed text-[#b0b8bc]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}