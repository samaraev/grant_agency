const number = (value) => Number(value || 0).toLocaleString('ru-RU');

/** Страницы входа, после которых разговор дошёл до квалификации. */
export default function MetricaQualifiedPages({ rows, labels, empty }) {
  if (!rows.length) return <p className="text-[13px] text-[#8f9a9f]">{empty}</p>;

  const max = Math.max(...rows.map((row) => row.qualified), 1);

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.page}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-[13px] text-[#d7dcde]">{row.page}</span>
            <span className="shrink-0 text-[12px] text-white">{number(row.qualified)}</span>
          </div>
          <div className="mt-1 h-[5px] w-full bg-white/8">
            <div
              className="h-full bg-[#8E4A49]"
              style={{ width: `${Math.max(4, Math.round((row.qualified / max) * 100))}%` }}
            />
          </div>
        </li>
      ))}
      <li className="pt-1 text-[11px] text-[#6f7a7f]">{labels}</li>
    </ul>
  );
}