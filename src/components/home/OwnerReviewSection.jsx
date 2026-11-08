import { Check } from 'lucide-react';
import LeadForm from '@/components/LeadForm';
import SectionHeading from '@/components/SectionHeading';
import { t } from '@/lib/i18n';

export default function OwnerReviewSection() {
  return (
    <section id="owner-review" className="border-y border-white/10 bg-[#1f272b]">
      <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
        <SectionHeading
          marker={t.home.ownerBlock.marker}
          title={t.home.ownerBlock.title}
          subtitle={t.home.ownerBlock.subtitle}
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div>
            <div className="eyebrow mb-4">{t.home.ownerBlock.questionsTitle}</div>
            <ul className="grid gap-px bg-white/10 sm:grid-cols-2">
              {t.home.ownerBlock.questions.map((question) => (
                <li
                  key={question}
                  className="flex gap-3 bg-[#1f272b] py-4 pr-2 text-[14px] leading-relaxed text-[#d7dcde]"
                >
                  <span className="mt-[7px] h-[5px] w-[5px] shrink-0 bg-[#c8102e]" aria-hidden="true" />
                  {question}
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-white/10 bg-[#263033] p-6 lg:p-7">
            <h3 className="text-[18px] font-bold text-white">{t.home.ownerBlock.getTitle}</h3>
            <ul className="mt-5 space-y-3">
              {t.home.ownerBlock.items.map((item) => (
                <li key={item} className="flex gap-3 text-[13.5px] leading-relaxed text-[#d7dcde]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c9b28c]" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-white/10 pt-4 text-[12px] leading-relaxed text-[#8f9a9f]">
              {t.home.ownerBlock.note}
            </p>
          </div>
        </div>

        <div className="mt-14 grid gap-10 border-t border-white/10 pt-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <div className="eyebrow">{t.home.ownerBlock.formTitle}</div>
            <h3 className="mt-4 font-heading text-[26px] leading-tight text-white sm:text-[32px]">
              {t.home.ownerBlock.cta}
            </h3>
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-[#b0b8bc]">
              {t.home.ownerBlock.formText}
            </p>
            <div className="mt-8 border-l-2 border-[#c8102e] pl-4 text-[13px] leading-relaxed text-[#d7dcde]">
              {t.home.hero.trustLine}
            </div>
          </div>
          <div className="border border-white/10 bg-[#263033] p-5 sm:p-7">
            <LeadForm defaultType="owner_appraise" cluster="khamovniki" />
          </div>
        </div>
      </div>
    </section>
  );
}