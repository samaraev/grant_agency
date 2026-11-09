const number = (value) => Number(value || 0).toLocaleString('ru-RU');
const cell = (value) => (value === null || value === undefined ? '—' : number(value));

/** Источник → визиты (Метрика) → обращения и дальше по воронке (CRM). */
export default function MetricaJoinTable({ rows, labels, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-white/10">
            {[labels.source, labels.visits, labels.leads, labels.qualified, labels.contracts, labels.deals].map(
              (title) => (
                <th
                  key={title}
                  className="py-2 pr-4 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#778287]"
                >
                  {title}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <tr key={row.source} className="border-b border-white/8 last:border-b-0">
                <td className="max-w-[220px] truncate py-2.5 pr-4 text-[13px] text-[#d7dcde]">
                  {row.source}
                </td>
                <td className="py-2.5 pr-4 text-[13px] text-white">{cell(row.visits)}</td>
                <td className="py-2.5 pr-4 text-[13px] text-white">{number(row.leads)}</td>
                <td className="py-2.5 pr-4 text-[13px] text-white">{number(row.qualified)}</td>
                <td className="py-2.5 pr-4 text-[13px] text-white">{number(row.contracts)}</td>
                <td className="py-2.5 text-[13px] text-white">{number(row.deals)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="py-4 text-[13px] text-[#8f9a9f]">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}