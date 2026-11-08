import { useEffect, useState } from 'react';
import { Image } from '@/components/ui/image';
import SectionHeading from '@/components/SectionHeading';
import { base44 } from '@/api/base44Client';
import { MAP_IMAGE } from '@/lib/sample-buildings';
import { applySeo } from '@/lib/seo';
import { track } from '@/lib/track';
import { t } from '@/lib/i18n';
import { useLang } from '@/components/LanguageProvider';

export default function About() {
  const [team, setTeam] = useState([]);
  const { lang } = useLang();

  useEffect(() => {
    return applySeo({ ...t.meta.about, path: '/o-nas', image: MAP_IMAGE });
  }, [lang]);

  useEffect(() => {
    track(t.track.pageView, { page: 'about' });
    base44.entities.TeamMember.filter({ is_public: true }, { limit: 20 })
      .then((page) => setTeam(page?.items || []))
      .catch(() => setTeam([]));
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pulse -right-[16%] -top-[30%] h-[62vw] w-[62vw] max-w-[680px]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-[1240px] gap-12 px-5 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-20">
          <div>
            <div className="eyebrow">{t.about.marker}</div>
            <h1 className="mt-5 text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-[44px] lg:text-[54px]">
              {t.about.title}
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#b0b8bc] sm:text-[17px]">
              {t.about.lead}
            </p>
          </div>
          <div className="relative aspect-[3/2] w-full overflow-hidden border border-white/10">
            <Image src={MAP_IMAGE} alt={t.about.photoAlt} className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <div className="eyebrow">01 / ПОДХОД</div>
            <h2 className="mt-4 text-[26px] font-bold leading-tight text-white sm:text-[34px]">
              Знание района как рабочий инструмент
            </h2>
          </div>
          <div className="space-y-5">
            {t.about.story.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="text-[14.5px] leading-[1.8] text-[#d7dcde]">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#1f272b]">
        <div className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-20">
          <div className="eyebrow mb-8">{t.about.blocks.marker}</div>
          <div className="grid gap-px bg-white/10 sm:grid-cols-3">
            {t.about.blocks.items.map((item) => (
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

      <section className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-20">
        <SectionHeading
          marker={t.about.team.marker}
          title={t.about.team.title}
          subtitle={t.about.team.subtitle}
        />
        {team.length ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => (
              <article key={member.id} className="flex flex-col border border-white/10 bg-[#263033] p-6">
                <div className="flex items-center gap-4">
                  {member.photo_url ? (
                    <Image
                      src={member.photo_url}
                      alt={member.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center border border-white/15 bg-[#1f272b] text-[19px] font-bold text-[#f4a7b0]">
                      {member.name
                        .split(' ')
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                  )}
                  <div>
                    <h3 className="text-[17px] font-bold text-white">{member.name}</h3>
                    <p className="mt-1 text-[12px] uppercase tracking-[0.12em] text-[#f4a7b0]">
                      {member.role}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-[13.5px] leading-relaxed text-[#b0b8bc]">{member.local_bio}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-[14px] text-[#8f9a9f]">{t.about.team.empty}</p>
        )}
      </section>
    </div>
  );
}