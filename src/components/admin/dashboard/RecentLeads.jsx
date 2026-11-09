import { Link } from 'react-router-dom';
import { t, dateLocale } from '@/lib/i18n';
import { normalizeStatus, STATUS_TONE } from '@/lib/leadStatus';

const shortDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(dateLocale(), { day: '2-digit', month: '2-digit' });
};

export default function RecentLeads({ leads }) {
  const c = t.admin.dashboard;

  return (
    <section className="border border-white/10 bg-[#263033] p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="eyebrow">{c.recentTitle}</div>
        <Link to="/admin/leads" className="text-[11.5px] text-[#c9b28c] hover:text-white">
          {t.admin.nav.leads}
        </Link>
      </div>

      {leads.length ? (
        <ul className="mt-3 divide-y divide-white/8">
          {leads.map((lead) => {
            const status = normalizeStatus(lead.status);
            return (
              <li key={lead.id}>
                <Link
                  to={`/admin/leads/${lead.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 hover:text-white"
                >
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[#d7dcde]">
                    {lead.name || '—'}
                  </span>
                  <span className="w-[38%] truncate text-[11.5px] text-[#8f9a9f] sm:w-[26%]">
                    {t.lead.types[lead.type] || lead.type || '—'}
                  </span>
                  <span
                    className={`shrink-0 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${STATUS_TONE[status]}`}
                  >
                    {t.admin.leads.statuses[status]}
                  </span>
                  <span className="w-12 shrink-0 text-right text-[11.5px] text-[#6f7a7f]">
                    {shortDate(lead.created_date)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] text-[#8f9a9f]">{c.noData}</p>
      )}
    </section>
  );
}