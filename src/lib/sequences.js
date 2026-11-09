// Сценарии сообщений на клиенте: триггеры по статусу, подстановки, ссылки.
// Правила отправки (согласие, рабочие часы, очередь) продублированы на сервере
// в base44/shared/sequences.ts — фронтенд не может импортировать base44/.

export const SEQUENCE_KEYS = [
  'first_reply',
  'meeting_confirmation',
  'no_answer',
  'price_analysis_followup',
  'thank_you_after_meeting',
];

export const SEQUENCE_CHANNELS = ['email', 'sms', 'whatsapp'];

// Ответ на обращение и подтверждение встречи — транзакционные: согласие не требуется.
export const TRANSACTIONAL_KEYS = ['first_reply', 'meeting_confirmation'];

export const needsConsent = (key) => !TRANSACTIONAL_KEYS.includes(key);

export function mergeLead(text, lead) {
  const map = {
    '{имя}': lead?.name || '',
    '{адрес}': lead?.address_text || '',
    '{ответственный}': lead?.responsible || '',
    '{телефон}': lead?.phone || '',
    '{время_встречи}': lead?.next_action_date || '',
  };
  return Object.keys(map).reduce((acc, key) => acc.split(key).join(map[key]), String(text || ''));
}

/** Сценарий по статусу обращения. Флаги приходят из загруженных данных. */
export function triggerForLead(lead, { answeredOutbound24h = false, hasAnalysis = false } = {}) {
  const status = lead?.status;
  if (status === 'new_inquiry') return 'first_reply';
  if (status === 'meeting_scheduled') return 'meeting_confirmation';
  if (status === 'meeting_held') return 'thank_you_after_meeting';
  if (status === 'contact_made') return answeredOutbound24h ? null : 'no_answer';
  if (status === 'qualified_conversation') return hasAnalysis ? 'price_analysis_followup' : null;
  return null;
}

export function channelTarget(channel, lead) {
  if (channel === 'email') return String(lead?.email || '').trim();
  return String(lead?.phone || '').trim();
}

export function whatsappLink(phone, text) {
  const digits = String(phone || '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text || '')}`;
}