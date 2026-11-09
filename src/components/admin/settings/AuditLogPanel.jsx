import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { dateLocale, t } from '@/lib/i18n';

const FIELD =
  'h-[34px] border border-white/10 bg-[#1f272b] px-2.5 text-[12.5px] text-white focus:border-[#c8102e] focus:outline-none';

/** Журнал доступа: последние 100 записей, только чтение. */
export default function AuditLogPanel() {
  const copy = t.admin.audit;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [actor, setActor] = useState('');

  useEffect(() => {
    base44.entities.AuditLog.list({ sort: '-at', limit: 100 })
      .then((page) => setRows(page?.items || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const actions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.action).filter(Boolean))),
    [rows]
  );

  const filtered = rows.filter((row) => {
    if (action && row.action !== action) return false;
    if (actor && !String(row.actor || '').toLowerCase().includes(actor.toLowerCase())) return false;
    return true;
  });

  return (
    <section className="mt-8 border-t border-white/10 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-white">{copy.title}</h2>
          <p className="mt-1 text-[12px] text-[#8f9a9f]">{copy.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className={FIELD} value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">{copy.filters.allActions}</option>
            {actions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            className={FIELD}
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            placeholder={copy.filters.actor}
          />
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-[13px] text-[#8f9a9f]">{t.admin.common.loading}</p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 text-[13px] text-[#8f9a9f]">{copy.empty}</p>
      ) : (
        <div className="mt-4 overflow-x-auto border border-white/10">
          <table className="w-full min-w-[720px] text-left text-[12.5px]">
            <thead className="bg-[#263033] text-[10.5px] uppercase tracking-[0.1em] text-[#8f9a9f]">
              <tr>
                <th className="px-3 py-2.5 font-medium">{copy.columns.at}</th>
                <th className="px-3 py-2.5 font-medium">{copy.columns.actor}</th>
                <th className="px-3 py-2.5 font-medium">{copy.columns.action}</th>
                <th className="px-3 py-2.5 font-medium">{copy.columns.entity}</th>
                <th className="px-3 py-2.5 font-medium">{copy.columns.meta}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8 bg-[#1a2025]">
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2.5 whitespace-nowrap text-[#8f9a9f]">
                    {row.at ? new Date(row.at).toLocaleString(dateLocale()) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-[#b0b8bc]">{row.actor || '—'}</td>
                  <td className="px-3 py-2.5 text-white">{row.action}</td>
                  <td className="px-3 py-2.5 text-[#8f9a9f]">
                    {row.entity || '—'}
                    {row.entity_id ? (
                      <span className="ml-1 text-[11px] text-[#5f696d]">#{String(row.entity_id).slice(-6)}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-[11.5px] text-[#6f7a7f]">
                    {row.meta ? JSON.stringify(row.meta) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}