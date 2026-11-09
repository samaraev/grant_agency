import { t } from '@/lib/i18n';
import BarRow from '@/components/admin/dashboard/BarRow';

// «В работе» — от нового обращения до назначенной встречи.
const WORK = ['new_inquiry', 'contact_made', 'target_inquiry', 'qualified_conversation', 'meeting_scheduled'];
// «Результат» — встреча и дальше, плюс нецелевые.
const RESULT = ['meeting_held', 'contract_signed', 'listed_or_search_started', 'deal_closed', 'non_target'];
// Финальные статусы показываем всегда: ноль в сделках — это тоже сигнал.
const ALWAYS = ['deal_closed', 'non_target'];

function SummaryRow({ label, value, tone }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[12.5px] text-[#8f9a9f]">{label}</span>
      <span className={`text-[14px] font-semibold ${tone || 'text-white'}`}>{value}</span>
    </div>
  );
}

export default function FunnelHealth({ funnel, total, khamovniki, owners, buyers, meaningful }) {
  const c = t.admin.dashboard;
  const rows = (keys) =>
    keys.filter((key) => funnel[key] > 0 || ALWAYS.includes(key));
  const workRows = rows(WORK);
  const resultRows = rows(RESULT);
  const max = Math.max(1, ...Object.values(funnel));
  const empty = total === 0;

  return (
    <section className="border border-white/10 bg-[#263033] p-6">
      <div className="eyebrow">{c.funnelTitle}</div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div>
          {empty ? (
            <p className="text-[13px] text-[#8f9a9f]">{c.noData}</p>
          ) : (
            <div className="space-y-5">
              {workRows.length ? (
                <div>
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-[#6f7a7f]">
                    {c.groupWork}
                  </div>
                  <div className="mt-2">
                    {workRows.map((key) => (
                      <BarRow
                        key={key}
                        label={t.admin.leads.statuses[key]}
                        value={funnel[key]}
                        max={max}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {resultRows.length ? (
                <div>
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-[#6f7a7f]">
                    {c.groupResult}
                  </div>
                  <div className="mt-2">
                    {resultRows.map((key) => (
                      <BarRow
                        key={key}
                        label={t.admin.leads.statuses[key]}
                        value={funnel[key]}
                        max={max}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <SummaryRow label={c.totalLeads} value={total} />
          <SummaryRow
            label={c.khamovnikiRow}
            value={khamovniki}
            tone={khamovniki > 0 ? 'text-white' : 'text-[#ff8a96]'}
          />
          <SummaryRow label={c.rolesRow} value={`${owners} / ${buyers}`} />

          <div className="border-t border-white/10 pt-3">
            <div className="eyebrow">{c.meaningful}</div>
            <div className="mt-2 text-[26px] font-bold leading-none text-[#c9b28c]">
              {meaningful} / {total}
            </div>
            <p className="mt-2 text-[11px] leading-snug text-[#6f7a7f]">{c.meaningfulHint}</p>
          </div>
        </div>
      </div>
    </section>
  );
}