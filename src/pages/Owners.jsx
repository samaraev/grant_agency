import { useEffect } from 'react';
import { Check } from 'lucide-react';
import AddressSearch from '@/components/AddressSearch';
import LeadForm from '@/components/LeadForm';
import SectionHeading from '@/components/SectionHeading';
import { useBuildingList } from '@/hooks/useBuildings';
import { applySeo } from '@/lib/seo';
import { track } from '@/lib/track';
import { t } from '@/lib/i18n';
import { useLang } from '@/components/LanguageProvider';

export default function Owners() {
  const { buildings } = useBuildingList({ limit: 200 });
  const { lang } = useLang();

  useEffect(() => {
    return applySeo({ ...t.meta.owners, path: '/sobstvennikam' });
  }, [lang]);

  useEffect(() => {
    track(t.track.pageView, { page: 'owners' });
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pulse -left-[20%] -top-[30%] h-[70vw] w-[70vw] max-w-[760px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="eyebrow">{t.owners.marker}</div>
            <h1 className="mt-5 text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-[44px] lg:text-[56px]">
              {t.owners.title}
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#b0b8bc] sm:text-[17px]">
              {t.owners.subtitle}
            </p>
          </div>
          <div className="mt-10 max-w-[38rem]">
            <AddressSearch
              buildings={buildings}
              label={t.owners.searchTitle}
              placeholder={t.home.hero.searchPlaceholder}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-20">
        <SectionHeading marker={t.owners.questionsMarker} title={t.owners.questionsTitle} />
        <div className="mt-10 grid gap-px bg-white/10 sm:grid-cols-2">
          {t.owners.questions.map((item, index) => (
            <div key={item.title} className="bg-[#1a2025] p-6 lg:p-7">
              <div className="font-mono text-[11px] tracking-[0.2em] text-[#c8102e]">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h3 className="mt-3 text-[17px] font-bold text-white">«{item.title}»</h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#b0b8bc]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#1f272b]">
        <div className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-20">
          <SectionHeading marker={t.owners.how.marker} title={t.owners.how.title} />
          <ol className="mt-10 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {t.owners.how.steps.map((step, index) => (
              <li key={step.title} className="bg-[#1f272b] p-6">
                <div className="font-mono text-[20px] text-[#c8102e]">0{index + 1}</div>
                <h3 className="mt-3 text-[16px] font-bold uppercase tracking-[0.06em] text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[#b0b8bc]">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <div className="eyebrow">{t.owners.honestMarker}</div>
            <h2 className="mt-4 text-[26px] font-bold leading-tight text-white sm:text-[34px]">
              {t.owners.honest.title}
            </h2>
          </div>
          <ul className="space-y-4">
            {t.owners.honest.items.map((item) => (
              <li key={item} className="flex gap-3 text-[14px] leading-relaxed text-[#d7dcde]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c9b28c]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#1f272b]">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-8 lg:py-20">
          <div>
            <div className="eyebrow">{t.owners.marker}</div>
            <h2 className="mt-4 text-[26px] font-bold leading-tight text-white sm:text-[34px]">
              {t.owners.formTitle}
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-[#b0b8bc]">{t.owners.formText}</p>
            <div className="mt-8 border-l-2 border-[#c8102e] pl-4 text-[13px] leading-relaxed text-[#d7dcde]">
              {t.home.hero.trustLine}
            </div>
          </div>
          <div className="border border-white/10 bg-[#263033] p-5 sm:p-7">
            <LeadForm defaultType="owner_appraise" />
          </div>
        </div>
      </section>
    </div>
  );
}