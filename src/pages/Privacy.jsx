import { useEffect } from 'react';
import { applySeo } from '@/lib/seo';
import { t } from '@/lib/i18n';

export default function Privacy() {
  useEffect(() => {
    const cleanup = applySeo({ ...t.meta.privacy, path: '/politika-konfidencialnosti', robots: 'noindex, follow' });
    return cleanup;
  }, []);

  return (
    <div className="mx-auto max-w-[820px] px-5 py-14 lg:px-8 lg:py-20">
      <div className="eyebrow">{t.privacy.marker}</div>
      <h1 className="mt-4 text-[30px] font-extrabold leading-tight text-white sm:text-[40px]">
        {t.privacy.title}
      </h1>
      <p className="mt-4 border border-[#c8102e]/40 bg-[#c8102e]/10 px-4 py-3 text-[12.5px] text-[#f4a7b0]">
        {t.privacy.updated}
      </p>
      <p className="mt-8 text-[14.5px] leading-[1.8] text-[#d7dcde]">{t.privacy.intro}</p>

      <div className="mt-10 space-y-7">
        {t.privacy.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-[17px] font-bold text-white">{section.title}</h2>
            <p className="mt-2 text-[14px] leading-[1.8] text-[#b0b8bc]">{section.text}</p>
          </section>
        ))}
      </div>

      <p className="mt-12 border-t border-white/10 pt-6 text-[12px] leading-relaxed text-[#6f7a7f]">
        {t.privacy.placeholderNote}
      </p>
    </div>
  );
}