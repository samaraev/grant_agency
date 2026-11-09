import { Fragment } from 'react';
import { t, dateLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { STATUS_TONE, normalizeStatus, statusLabel } from '@/lib/leadStatus';
import { dealCurrency, formatMoney } from '@/lib/deal';

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

export default function LeadsTable({ leads, loading, onOpen, showDealValue, openTasks }) {
  const columns = [
    {
      key: 'created',
      label: t.admin.leads.columns.created,
      cell: (lead) => (
        <td className="whitespace-nowrap px-4 py-3 text-[#8f9a9f]">
          {new Date(lead.created_date).toLocaleDateString(dateLocale())}
        </td>
      ),
    },
    {
      key: 'name',
      label: t.admin.leads.columns.name,
      cell: (lead) => (
        <td className="px-4 py-3 text-white">
          <span className="whitespace-nowrap">{lead.name}</span>
          {openTasks?.[lead.id] ? (
            <span
              title={t.admin.tasks.title}
              className="ml-2 inline-flex min-w-[18px] items-center justify-center border border-[#c9b28c]/50 px-1 text-[10.5px] text-[#c9b28c]"
            >
              {openTasks[lead.id]}
            </span>
          ) : null}
        </td>
      ),
    },
    {
      key: 'phone',
      label: t.admin.leads.columns.phone,
      cell: (lead) => <td className="whitespace-nowrap px-4 py-3 text-[#d7dcde]">{lead.phone}</td>,
    },
    {
      key: 'type',
      label: t.admin.leads.columns.type,
      cell: (lead) => <td className="px-4 py-3 text-[#d7dcde]">{t.lead.types[lead.type] || lead.type}</td>,
    },
    {
      key: 'person_role',
      label: t.admin.leads.columns.personRole,
      cell: (lead) => (
        <td className="whitespace-nowrap px-4 py-3 text-[#b0b8bc]">
          {t.admin.leads.funnel.personRoles[lead.person_role] || t.admin.leads.funnel.notChosen}
        </td>
      ),
    },
    {
      key: 'area_flag',
      label: t.admin.leads.columns.area,
      cell: (lead) => (
        <td className="whitespace-nowrap px-4 py-3 text-[#b0b8bc]">
          {t.admin.leads.funnel.areas[lead.area_flag] || t.admin.leads.funnel.areas.unknown}
        </td>
      ),
    },
    {
      key: 'address_text',
      label: t.admin.leads.columns.address,
      cell: (lead) => (
        <td className="max-w-[220px] truncate px-4 py-3 text-[#b0b8bc]">{lead.address_text || <Dash />}</td>
      ),
    },
    {
      key: 'source',
      label: t.admin.leads.columns.source,
      cell: (lead) => <td className="px-4 py-3 text-[#8f9a9f]">{lead.source || 'direct'}</td>,
    },
    {
      key: 'status',
      label: t.admin.leads.columns.status,
      cell: (lead) => (
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
      ),
    },
    {
      key: 'deal_value',
      label: t.admin.leads.columns.dealValue,
      hidden: !showDealValue,
      cell: (lead) => (
        <td className="whitespace-nowrap px-4 py-3 text-[#d7dcde]">
          {lead.deal_value ? formatMoney(lead.deal_value, dealCurrency(lead)) : <Dash />}
        </td>
      ),
    },
    {
      key: 'intent_rating',
      label: t.admin.leads.columns.intent,
      cell: (lead) => (
        <td className="px-4 py-3">
          {lead.intent_rating ? (
            <span className={cn('px-2 py-1 text-[10.5px] uppercase tracking-[0.1em]', INTENT_CLASS[lead.intent_rating])}>
              {t.admin.leads.funnel.intents[lead.intent_rating]}
            </span>
          ) : (
            <Dash />
          )}
        </td>
      ),
    },
    {
      key: 'responsible',
      label: t.admin.leads.columns.responsible,
      cell: (lead) => <td className="whitespace-nowrap px-4 py-3 text-[#8f9a9f]">{lead.responsible || <Dash />}</td>,
    },
    {
      key: 'next_action',
      label: t.admin.leads.columns.nextAction,
      cell: (lead) => (
        <td className="whitespace-nowrap px-4 py-3 text-[#8f9a9f]">
          {lead.next_action_date || lead.next_action_note || <Dash />}
        </td>
      ),
    },
    {
      key: 'meaningful',
      label: t.admin.leads.columns.meaningful,
      cell: (lead) => (
        <td className="px-4 py-3">
          <span
            className={cn(
              'border px-2 py-1 text-[10.5px] uppercase tracking-[0.1em]',
              lead.is_meaningful ? 'border-[#c8102e] bg-[#c8102e] text-white' : 'border-white/15 text-[#6f7a7f]'
            )}
          >
            {lead.is_meaningful ? '✓' : '—'}
          </span>
        </td>
      ),
    },
  ];

  const visible = columns.filter((column) => !column.hidden);

  return (
    <div className="overflow-x-auto border border-white/10">
      <table className="w-full min-w-[1180px] text-left">
        <thead className="bg-[#1f272b] text-[10.5px] uppercase tracking-[0.14em] text-[#778287]">
          <tr>
            {visible.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-4 py-3 font-medium">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8 text-[13px]">
          {loading ? (
            <tr>
              <td colSpan={visible.length} className="px-4 py-8 text-center text-[#8f9a9f]">
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
                {visible.map((column) => (
                  <Fragment key={column.key}>{column.cell(lead)}</Fragment>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={visible.length} className="px-4 py-10 text-center text-[#8f9a9f]">
                {t.admin.leads.empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}