import { useEffect, useRef, useState } from 'react';

/** Точки-акцент: убывающая диагональ, как в макете. */
const DOTS = [
  [14, 14, 0.54],
  [38, 14, 0.36],
  [62, 14, 0.18],
  [86, 14, 0],
  [38, 38, 0.54],
  [62, 38, 0.36],
  [86, 38, 0.18],
  [62, 62, 0.54],
  [86, 62, 0.36],
  [86, 86, 0.54],
];

function useCountUp(target, active) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setCurrent(target);
      return undefined;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / 1200, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else setCurrent(target);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active]);

  return current;
}

/**
 * Плашка показателя: крупное число, две пары «подпись / значение»,
 * диагональ из точек и зерно. Адаптировано под тёмную тему админки.
 */
export default function MetricaStatCard({ label, value, format, details = [], note }) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  const current = useCountUp(Number(value) || 0, active);
  const fmt = format || ((n) => Math.round(n).toLocaleString('ru-RU'));

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setActive(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-metrica-reveal={active ? '' : undefined}
      className="relative flex flex-col justify-between gap-7 overflow-hidden border border-white/10 bg-[#263033] p-5"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(125% 125% at 100% 0%, rgba(142,74,73,0.34) 0%, rgba(142,74,73,0.12) 32%, rgba(142,74,73,0) 64%)',
        }}
        aria-hidden="true"
      />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-15 mix-blend-overlay"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="metrica-grain">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#metrica-grain)" />
      </svg>

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="eyebrow">{label}</div>
          {note ? <div className="mt-2 text-[11px] text-[#6f7a7f]">{note}</div> : null}
        </div>
        <svg
          className="h-9 w-9 shrink-0"
          viewBox="0 0 100 100"
          fill="#D4A373"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          {DOTS.map(([cx, cy, delay]) => (
            <circle
              key={`${cx}-${cy}`}
              className="metrica-dot"
              style={{ '--dot-delay': `${delay}s` }}
              cx={cx}
              cy={cy}
              r="9"
            />
          ))}
        </svg>
      </div>

      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="font-heading text-[34px] font-medium leading-none tracking-tight text-white">
          {fmt(current)}
        </div>
        {details.length ? (
          <dl className="flex flex-wrap gap-x-6 gap-y-2">
            {details.map((item) => (
              <div key={item.label} className="min-w-0">
                <dt className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                  {item.label}
                </dt>
                <dd className="mt-1 text-[13px] font-medium text-white">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </div>
  );
}