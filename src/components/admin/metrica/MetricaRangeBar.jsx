import { cn } from '@/lib/utils';

const PRESETS = [7, 30, 90];
const FIELD =
  'h-[36px] border border-white/10 bg-[#1f272b] px-2 text-[12.5px] text-white focus:border-[#c8102e] focus:outline-none';

/** Период отчёта: пресеты 7/30/90 дней и произвольные даты. */
export default function MetricaRangeBar({ days, from, to, labels, onPreset, onFrom, onTo }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onPreset(preset)}
            className={cn(
              'min-h-[36px] border px-3 text-[12px] transition-colors',
              days === preset
                ? 'border-[#c8102e] bg-[#c8102e]/15 text-white'
                : 'border-white/15 text-[#9aa4a8] hover:text-white'
            )}
          >
            {labels[`d${preset}`]}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-1 text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
          {labels.from}
          <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className={FIELD} />
        </label>
        <label className="flex flex-col gap-1 text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
          {labels.to}
          <input type="date" value={to} onChange={(e) => onTo(e.target.value)} className={FIELD} />
        </label>
      </div>
    </div>
  );
}