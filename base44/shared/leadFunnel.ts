// Общие правила воронки обращений: статусы, миграция старых значений, роль человека.

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

export const STATUS_LABELS = {
  new_inquiry: 'Новое обращение',
  contact_made: 'Контакт установлен',
  target_inquiry: 'Целевое обращение',
  qualified_conversation: 'Квалифицированный разговор',
  meeting_scheduled: 'Встреча назначена',
  meeting_held: 'Встреча проведена',
  contract_signed: 'Договор подписан',
  listed_or_search_started: 'В продаже или подбор начат',
  deal_closed: 'Сделка',
  non_target: 'Нецелевое обращение',
};

/** Соответствие старых статусов новым. Используется миграцией и подписями в интерфейсе. */
export const LEGACY_STATUS_MAP = {
  new: 'new_inquiry',
  contacted: 'contact_made',
  qualified: 'qualified_conversation',
  meeting_set: 'meeting_scheduled',
  agreement: 'contract_signed',
  closed: 'non_target',
  spam: 'non_target',
};

/** Что именно миграция записывает в старые записи. */
export const LEGACY_MIGRATION = {
  new: { to: 'new_inquiry' },
  contacted: { to: 'contact_made' },
  qualified: { to: 'qualified_conversation' },
  meeting_set: { to: 'meeting_scheduled' },
  agreement: { to: 'contract_signed' },
  closed: { to: 'non_target', rejection_reason: 'legacy_closed', tags: ['check_legacy'] },
  spam: { to: 'non_target', rejection_reason: 'спам' },
};

export const CHECKLIST_KEYS = [
  'owner_need_confirmed',
  'object_confirmed',
  'real_intent',
  'timeframe_recorded',
  'meeting_agreed',
  'terms_fit',
];

export const PIPELINE_KEYS = ['owner_sale', 'buyer_search', 'rental'];

/**
 * Воронка по типу обращения — единственный источник правила:
 * owner_* → owner_sale, buyer_* → buyer_search, rent → rental, general и пустое → owner_sale.
 * Используется формой (submitLead), бэкфиллом старых записей и интерфейсом.
 * Держать в синхронизации с src/lib/pipeline.js (фронтенд не может импортировать base44/).
 */
export function inferPipeline(type) {
  if (PIPELINE_KEYS.includes(type)) return type;
  if (type === 'rent') return 'rental';
  if (type === 'buyer_buy' || type === 'buyer_check') return 'buyer_search';
  return 'owner_sale';
}

/** Роль человека по типу обращения; администратор может уточнить её вручную. */
export function inferPersonRole(type) {
  if (type === 'owner_appraise' || type === 'owner_sell') return 'owner';
  if (type === 'buyer_buy' || type === 'buyer_check') return 'buyer';
  if (type === 'rent') return 'tenant';
  return 'other';
}