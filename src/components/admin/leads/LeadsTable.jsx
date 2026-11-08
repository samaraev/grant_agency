import { t, dateLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { STATUS_TONE, normalizeStatus, statusLabel } from '@/lib/leadStatus';

const AGREEMENT_CLASS = {
  none: 'bg-white/10 text-[#9aa4a8]',
  agency: 'bg-blue-500/15 text-blue-300',
  exclusive: 'bg-green-500/15 text-green-300',
};

const INTENT_CLASS = {
  low: 'bg-red-500/15 text-red-300',
  medium: 'bg-yellow-500/15 text-yellow-300',
  high: 'bg-green-500/15 text-green-300',
};

function Dash() {
  return <span className="text-[#5f696d]">—</span>;
}

export default function LeadsTable({ leads, loading, onOpen }) {
  const columns = [
    t.admin.leads.columns.created,
    t.admin.leads.columns.name,
    t.admin.leads.columns.phone,
    t.admin.leads.columns.type,
    t.admin.leads.columns.personRole,
    t.admin.leads.columns.area,
    t.admin.leads.columns.address,
    t.admin.leads.columns.source,
    t.admin.leads.columns.status,
    t.admin.leads.columns.intent,
    t.admin.leads.columns.responsible,
    t.admin.leads.columns.nextAction,
    t.admin.leads.columns.meaningful,
  ];

  return (
    <div className="overflow-x-auto border border-white/10">
      <table className="w-full min-w-[1180px] text-left">
        <thead className="bg-[#1f272b] text-[10.5px] uppercase tracking-[0.14em] text-[#778287]">
          <tr>
            {columns.map((label) => (
              <th key={label} className="whitespace-nowrap px-4 py-3 font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8 text-[13px]">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[#8f9a9f]">
                {t.admin.common.loading}
              </td>
            </tr>
          ) : leads.length ? (
            leads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => onOpen(lead)}
                className="cursor-pointer bg-[#1a2025] hover:bg-white/[0.03]"
              >
                <td className="whitespace-nowrap px-4 py-3 text-[#8f9a9f]">
                  {new Date(lead.created_date).toLocaleDateString(dateLocale())}
                </td>
                <td className="px-4 py-3 text-white">{lead.name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-[#d7dcde]">{lead.phone}</td>
                <td className="px-4 py-3 text-[#d7dcde]">{t.lead.types[lead.type] || lead.type}</td>
                <td className="whitespace-nowrap px-4 py-3 text-[#b0b8bc]">
                  {t.admin.leads.funnel.personRoles[lead.person_role] || t.admin.leads.funnel.notChosen}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[#b0b8bc]">
                  {t.admin.leads.funnel.areas[lead.area_flag] || t.admin.leads.funnel.areas.unknown}
                </td>
                <td className="max-w-[220px] truncate px-4 py-3 text-[#b0b8bc]">
                  {lead.address_text || <Dash />}
                </td>
                <td className="px-4 py-3 text-[#8f9a9f]">{lead.source || 'direct'}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'whitespace-nowrap px-2 py-1 text-[10.5px] uppercase tracking-[0.1em]',
                      STATUS_TONE[normalizeStatus(lead.status)] || 'bg-white/10 text-[#9aa4a8]'
                    )}
                  >
                    {statusLabel(lead.status, t)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {lead.intent_rating ? (
                    <span className={cn('px-2 py-1 text-[10.5px] uppercase tracking-[0.1em]', INTENT_CLASS[lead.intent_rating])}>
                      {t.admin.leads.funnel.intents[lead.intent_rating]}
                    </span>
                  ) : (
                    <Dash />
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[#8f9a9f]">{lead.responsible || <Dash />}</td>
                <td className="whitespace-nowrap px-4 py-3 text-[#8f9a9f]">
                  {lead.next_action_date || lead.next_action_note || <Dash />}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'border px-2 py-1 text-[10.5px] uppercase tracking-[0.1em]',
                      lead.is_meaningful
                        ? 'border-[#c8102e] bg-[#c8102e] text-white'
                        : 'border-white/15 text-[#6f7a7f]'
                    )}
                  >
                    {lead.is_meaningful ? '✓' : '—'}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-[#8f9a9f]">
                {t.admin.leads.empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}