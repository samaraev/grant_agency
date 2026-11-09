// Горизонтальная полоса для воронки, типов и источников. Одна геометрия на весь дашборд.
export default function BarRow({ label, value, max, tone }) {
  const width = max > 0 ? Math.max(3, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-[44%] truncate text-[12.5px] text-[#b0b8bc]">{label}</div>
      <div className="h-[6px] flex-1 bg-white/8">
        <div className={`h-full ${tone || 'bg-[#c8102e]'}`} style={{ width: `${width}%` }} />
      </div>
      <div className="w-8 shrink-0 text-right text-[12px] text-white">{value}</div>
    </div>
  );
}