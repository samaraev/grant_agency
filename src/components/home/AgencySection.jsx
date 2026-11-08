import { t } from '@/lib/i18n';

export default function AgencySection() {
  const a = t.homepage.agency;

  return (
    <section className="border-b border-white/10 bg-[#1f272b]">
      <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="eyebrow">{a.marker}</div>
        <div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#c9b28c]">{a.eyebrow}</div>
        <h2 className="mt-4 font-heading text-[32px] leading-[1.08] text-white sm:text-[44px] lg:text-[52px]">
          {a.title} <span className="italic text-[#c9b28c]">{a.titleAccent}</span>
        </h2>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <div className="space-y-1 font-heading text-[22px] italic leading-snug text-[#e6eaec] sm:text-[26px]">
              {a.lead.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <p className="mt-6 text-[14.5px] leading-relaxed text-[#b0b8bc]">{a.text}</p>
            <p className="mt-4 text-[14.5px] leading-relaxed text-[#b0b8bc]">{a.text2}</p>
            <div className="mt-8 border-l-2 border-[#c8102e] pl-5">
              <div className="text-[15px] font-semibold text-white">{a.principleTitle}</div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[#d7dcde]">{a.principle}</p>
            </div>
          </div>

          <div>
            <div className="eyebrow">{a.historyTitle}</div>
            <ol className="mt-5 divide-y divide-white/10 border-y border-white/10">
              {a.history.map((item) => (
                <li key={item.year} className="grid gap-2 py-6 sm:grid-cols-[112px_1fr] sm:gap-6">
                  <span className="font-heading text-[26px] leading-none text-[#c9b28c]">
                    {item.year}
                  </span>
                  <div>
                    <div className="text-[15px] font-semibold text-white">{item.title}</div>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-[#b0b8bc]">{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}