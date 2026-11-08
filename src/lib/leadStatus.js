// Статусы воронки обращений и мягкий показ устаревших значений.

export const STATUS_KEYS = [
  'new_inquiry',
  'contact_made',
  'target_inquiry',
  'qualified_conversation',
  'meeting_scheduled',
  'meeting_held',
  'contract_signed',
  'listed_or_search_started',
  'deal_closed',
  'non_target',
];

export const STATUS_TONE = {
  new_inquiry: 'bg-blue-500/15 text-blue-300',
  contact_made: 'bg-blue-500/15 text-blue-300',
  target_inquiry: 'bg-yellow-500/15 text-yellow-300',
  qualified_conversation: 'bg-purple-500/15 text-purple-300',
  meeting_scheduled: 'bg-purple-500/15 text-purple-300',
  meeting_held: 'bg-purple-500/15 text-purple-300',
  contract_signed: 'bg-green-500/15 text-green-300',
  listed_or_search_started: 'bg-green-500/15 text-green-300',
  deal_closed: 'bg-green-500/15 text-green-300',
  non_target: 'bg-white/10 text-[#9aa4a8]',
};

export const LEGACY_STATUS_MAP = {
  new: 'new_inquiry',
  contacted: 'contact_made',
  qualified: 'qualified_conversation',
  meeting_set: 'meeting_scheduled',
  agreement: 'contract_signed',
  closed: 'non_target',
  spam: 'non_target',
};

/** Приводит устаревший статус к новому ключу. */
export function normalizeStatus(value) {
  return LEGACY_STATUS_MAP[value] || value || 'new_inquiry';
}

/** Подпись статуса: новые ключи, затем старые, затем сам ключ. */
export function statusLabel(value, content) {
  if (!value) return '—';
  const normalized = normalizeStatus(value);
  return (
    content?.admin?.leads?.statuses?.[normalized] ||
    content?.admin?.leads?.legacyStatuses?.[value] ||
    value
  );
}