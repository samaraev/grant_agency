import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { t } from '@/lib/i18n';
import { agentStats } from '@/lib/agentStats';
import { formatMoney } from '@/lib/deal';
import { downloadCsv, toCsv } from '@/lib/csv';
import { cn } from '@/lib/utils';

const PRESETS = [7, 30, 90];

export default function AgentStats({ leads }) {
  const copy = t.admin.analytics.agents;
  const [days, setDays] = useState(30);

  const rows = useMemo(() => {
    const to = Date.now();
    return agentStats(leads, to - days * 24 * 60 * 60 * 1000, to);
  }, [leads, days]);

  const exportCsv = () => {
    const columns = [
      { key: 'agent', label: copy.agent },
      { key: 'leads', label: copy.leads },
      { key: 'qualified', label: copy.qualified },
      { key: 'meetings', label: copy.meetings },
      { key: 'contracts', label: copy.contracts },
      { key: 'deals', label: copy.deals },
      { key: 'amount', label: copy.amount },
      { key: 'currency', label: copy.currency },
      { key: 'commission', label: copy.commission },
      { key: 'conversion', label: copy.conversion },
    ];
    const data = rows.map((row) => ({
      ...row,
      agent: row.agent || copy.unassigned,
      currency: row.currency || '',
      conversion: `${row.conversion}%`,
    }));
    downloadCsv(`agents-${days}d.csv`, toCsv(data, columns));
  };

  return (
    <div className="border border-white/10 bg-[#263033] p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{copy.title}</div>
          <p className="mt-1 text-[11.5px] text-[#6f7a7f]">{copy.hint}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex border border-white/15">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDays(preset)}
                aria-pressed={days === preset}
                className={cn(
                  'min-h-[34px] px-3 text-[12px]',
                  days === preset ? 'bg-[#c8102e] text-white' : 'text-[#9aa4a8] hover:text-white'
                )}
              >
                {copy.ranges[preset]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!rows.length}
            className="flex min-h-[34px] items-center gap-2 border border-white/15 px-3 text-[12px] text-white hover:border-[#c9b28c] disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {t.admin.leads.export}
          </button>
        </div>
      </div>

      {rows.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="text-[10.5px] uppercase tracking-[0.12em] text-[#778287]">
              <tr>
                {[copy.agent, copy.leads, copy.qualified, copy.meetings, copy.contracts, copy.deals, copy.amount, copy.commission, copy.conversion].map(
                  (label) => (
                    <th key={label} className="whitespace-nowrap border-b border-white/10 px-3 py-2 font-medium">
                      {label}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8 text-[12.5px]">
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="px-3 py-2.5 text-white">{row.agent || copy.unassigned}</td>
                  <td className="px-3 py-2.5 text-[#d7dcde]">{row.leads}</td>
                  <td className="px-3 py-2.5 text-[#d7dcde]">{row.qualified}</td>
                  <td className="px-3 py-2.5 text-[#d7dcde]">{row.meetings}</td>
                  <td className="px-3 py-2.5 text-[#d7dcde]">{row.contracts}</td>
                  <td className="px-3 py-2.5 text-[#d7dcde]">{row.deals}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[#d7dcde]">{formatMoney(row.amount, row.currency)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[#c9b28c]">{formatMoney(row.commission, row.currency)}</td>
                  <td className="px-3 py-2.5 text-white">{row.conversion}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-[13px] text-[#8f9a9f]">{copy.empty}</p>
      )}
    </div>
  );
}