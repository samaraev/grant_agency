// Свод по ответственным за период: считается из обращений, без отдельной сущности.

import { FUNNEL_STAGES, normalizeStatus, statusIndex } from '@/lib/leadStatus';
import { commissionAmount, dealCurrency } from '@/lib/deal';

const UNASSIGNED = '__unassigned__';

const reached = (lead, stage) => statusIndex(lead.status) >= FUNNEL_STAGES.indexOf(stage);

export function agentStats(leads, from, to) {
  const inRange = (value) => {
    if (!value) return false;
    const time = new Date(value).getTime();
    return time >= from && time <= to;
  };

  const rows = new Map();

  leads.forEach((lead) => {
    if (!inRange(lead.created_date)) return;

    const agent = (lead.responsible || '').trim();
    const key = agent || UNASSIGNED;
    const row = rows.get(key) || {
      key,
      agent,
      leads: 0,
      qualified: 0,
      meetings: 0,
      contracts: 0,
      deals: 0,
      amount: 0,
      commission: 0,
      currencies: new Set(),
    };

    row.leads += 1;
    if (reached(lead, 'qualified_conversation')) row.qualified += 1;
    if (reached(lead, 'meeting_held')) row.meetings += 1;
    if (reached(lead, 'contract_signed')) row.contracts += 1;

    if (normalizeStatus(lead.status) === 'deal_closed') {
      row.deals += 1;
      // Деньги считаем по дате закрытия сделки, а не по дате обращения.
      if (inRange(lead.closed_at)) {
        row.amount += Number(lead.deal_value) || 0;
        row.commission += commissionAmount(lead.deal_value, lead.commission_percent) || 0;
        if (Number(lead.deal_value) > 0) row.currencies.add(dealCurrency(lead));
      }
    }

    rows.set(key, row);
  });

  return [...rows.values()]
    .map((row) => ({
      ...row,
      // Символ валюты показываем, только если все сделки агента в одной валюте.
      currency: row.currencies.size === 1 ? [...row.currencies][0] : null,
      conversion: row.leads ? Math.round((row.deals / row.leads) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount || b.leads - a.leads);
}