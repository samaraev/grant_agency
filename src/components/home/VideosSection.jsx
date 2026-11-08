import { useState } from 'react';
import { ArrowUpRight, Play } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import { t } from '@/lib/i18n';

export default function VideosSection() {
  const v = t.homepage.videos;
  const [active, setActive] = useState(-1);

  return (
    <section id="videos" className="border-b border-white/10 bg-[#1f272b]">
      <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
        <SectionHeading marker={v.marker} title={v.title} subtitle={v.subtitle} />

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {v.items.map((item, index) => (
            <figure key={item.url} className="border border-white/10 bg-[#263033]">
              {active === index ? (
                <video
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  src={item.url}
                  className="aspect-video w-full bg-black"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`${v.watch}: ${item.title}`}
                  className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-[#1a2025] transition-colors hover:bg-[#1f272b]"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#c9b28c]/60 text-[#c9b28c]">
                    <Play className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.16em] text-[#8f9a9f]">
                    {v.watch}
                  </span>
                </button>
              )}
              <figcaption className="p-5">
                <div className="text-[15px] font-semibold text-white">{item.title}</div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-[#8f9a9f] transition-colors hover:text-[#c9b28c]"
                >
                  {v.open}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mt-6 max-w-3xl text-[12px] leading-relaxed text-[#778287]">{v.note}</p>
      </div>
    </section>
  );
}