import { Minus } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function ClusterLimits() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <div className="eyebrow">{t.cluster.limits.marker}</div>
          <h2 className="mt-4 text-[26px] font-bold leading-tight text-white sm:text-[34px]">
            {t.cluster.limits.title}
          </h2>
        </div>
        <ul className="space-y-4">
          {t.cluster.limits.items.map((item) => (
            <li key={item} className="flex gap-3 text-[14px] leading-relaxed text-[#d7dcde]">
              <Minus className="mt-1 h-4 w-4 shrink-0 text-[#c8102e]" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}