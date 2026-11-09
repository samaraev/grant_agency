// Сценарии сообщений: ключи, согласие, рабочие часы, отправка и очередь.
// Один модуль для changeLeadStatus (авто-отправка) и dispatchSequences (очередь).
import { mergeTemplate, sendSmsVia, smsConfigured } from './comms.ts';

export const SEQUENCE_KEYS = [
  'first_reply',
  'meeting_confirmation',
  'no_answer',
  'price_analysis_followup',
  'thank_you_after_meeting',
];

export const SEQUENCE_CHANNELS = ['email', 'sms', 'whatsapp'];

// Ответы на обращение и подтверждение встречи — транзакционные, согласие не требуется.
export const TRANSACTIONAL_KEYS = ['first_reply', 'meeting_confirmation'];

export const needsConsent = (key) => !TRANSACTIONAL_KEYS.includes(key);
export const hasConsent = (lead) => Boolean(lead && lead.consent_at);

const toMinutes = (value, fallback) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
  if (!match) return fallback;
  return Number(match[1]) * 60 + Number(match[2]);
};

export function workingWindow(settings) {
  return {
    start: toMinutes(settings && settings.working_hours_start, 600),
    end: toMinutes(settings && settings.working_hours_end, 1200),
  };
}

export function mskMinutes(date) {
  const at = date || new Date();
  const parts = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(at);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0) % 24;
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
  return hour * 60 + minute;
}

export function outsideWorkingHours(date, settings) {
  const { start, end } = workingWindow(settings);
  const minutes = mskMinutes(date);
  return minutes < start || minutes >= end;
}

/** Ближайшее начало рабочего окна по Москве (МСК — фиксированный UTC+3). */
export function nextWorkingStart(date, settings) {
  const at = date || new Date();
  const { start, end } = workingWindow(settings);
  const minutes = mskMinutes(at);
  if (minutes >= start && minutes < end) return at;
  const delta = minutes < start ? start - minutes : 24 * 60 - minutes + start;
  return new Date(at.getTime() + delta * 60000);
}

export function channelTarget(channel, lead) {
  if (channel === 'email') return String((lead && lead.email) || '').trim();
  return String((lead && lead.phone) || '').trim();
}

export function channelAvailable(channel, lead) {
  return Boolean(channelTarget(channel, lead));
}

export async function loadSettings(base44) {
  const page = await base44.asServiceRole.entities.AdminSettings.list({ limit: 1 }).catch(() => null);
  return (page && page.items && page.items[0]) || {};
}

export async function loadTemplate(base44, templateKey, channel) {
  if (!templateKey) return null;
  const page = await base44.asServiceRole.entities.MessageTemplate.filter(
    { name: templateKey, channel },
    { limit: 1 }
  ).catch(() => null);
  return (page && page.items && page.items[0]) || null;
}

export function renderTemplate(template, lead) {
  return {
    subject: mergeTemplate(template && template.subject, lead),
    body: mergeTemplate(template && template.body, lead),
  };
}

/** Какой сценарий соответствует статусу обращения (или null). */
export async function triggerFor(base44, lead) {
  const status = lead && lead.status;
  if (status === 'new_inquiry') return 'first_reply';
  if (status === 'meeting_scheduled') return 'meeting_confirmation';
  if (status === 'meeting_held') return 'thank_you_after_meeting';

  if (status === 'contact_made') {
    const page = await base44.asServiceRole.entities.Communication.filter(
      { lead_id: lead.id, direction: 'out', status: 'answered' },
      { sort: '-created_date', limit: 1 }
    ).catch(() => null);
    const last = page && page.items && page.items[0];
    const within = last && Date.now() - new Date(last.created_date).getTime() < 24 * 60 * 60 * 1000;
    return within ? null : 'no_answer';
  }

  if (status === 'qualified_conversation') {
    const page = await base44.asServiceRole.entities.OwnerAnalysis.filter(
      { lead_id: lead.id },
      { limit: 5 }
    ).catch(() => null);
    const filled = (page && page.items ? page.items : []).some(
      (item) => String(item.recommended_strategy || '').trim() || String(item.price_range_note || '').trim()
    );
    return filled ? 'price_analysis_followup' : null;
  }

  return null;
}

async function sendEmailNow(base44, { lead, subject, body, actor, settings }) {
  let ok = true;
  let failure = '';
  let providerId = '';
  try {
    const result = await base44.asServiceRole.integrations.Core.SendEmail({
      to: String(lead.email || '').trim(),
      subject: subject || 'Сообщение от агентства ГРАНТ',
      body,
      from_name: String((settings && settings.email_from_name) || '').trim() || undefined,
      category: 'transactional',
    });
    providerId = String((result && (result.message_id || result.id)) || '');
    if (result && result.success === false) {
      ok = false;
      failure = result.message || result.reason || 'send_failed';
    }
  } catch (error) {
    ok = false;
    failure = error.message;
  }
  return { ok, failure, providerId };
}

async function sendSmsNow(base44, { lead, body, settings }) {
  const provider = String((settings && settings.sms_provider) || 'none');
  if (!smsConfigured(provider)) {
    return { ok: false, manual: true, failure: 'sms_not_configured', providerId: '' };
  }
  const result = await sendSmsVia(provider, lead.phone, body, settings.sms_sender);
  return { ok: Boolean(result.ok), failure: result.error || '', providerId: result.provider_id || '' };
}

/**
 * Отправляет сообщение сразу и пишет одну строку в Communication.
 * WhatsApp API не настроен: канал работает как ссылка + ручная запись, поэтому
 * авто-отправка для него невозможна — возвращаем manual.
 */
export async function sendNow(
  base44,
  { lead, channel, template, actor, sequenceKey, settings, write = true }
) {
  const rendered = renderTemplate(template, lead);
  if (!rendered.body) return { ok: false, error: 'empty_template', manual: false };

  if (channel === 'whatsapp') {
    return { ok: false, manual: true, error: 'whatsapp_manual', rendered };
  }

  const result =
    channel === 'email'
      ? await sendEmailNow(base44, { lead, subject: rendered.subject, body: rendered.body, actor, settings })
      : await sendSmsNow(base44, { lead, body: rendered.body, settings });

  // write = false: строка Communication уже существует (очередь), её обновит вызывающий.
  if (!write) {
    return {
      ok: result.ok,
      manual: Boolean(result.manual),
      error: result.failure || '',
      providerId: result.providerId || '',
    };
  }

  const now = new Date().toISOString();
  const communication = await base44.asServiceRole.entities.Communication.create({
    lead_id: lead.id,
    channel,
    direction: 'out',
    subject: channel === 'email' ? rendered.subject : undefined,
    body: rendered.body,
    status: result.ok ? 'sent' : 'failed',
    provider_id: result.providerId || '',
    created_by: actor,
    sequence_key: sequenceKey,
    sent_at: result.ok ? now : undefined,
  });

  return { ok: result.ok, manual: Boolean(result.manual), error: result.failure || '', communication };
}

/** Ставит сообщение в очередь: отправку заберёт dispatchSequences. */
export async function queueSend(base44, { lead, channel, template, actor, sequenceKey, scheduledAt }) {
  const rendered = renderTemplate(template, lead);
  if (!rendered.body) return { ok: false, error: 'empty_template' };

  const communication = await base44.asServiceRole.entities.Communication.create({
    lead_id: lead.id,
    channel,
    direction: 'out',
    subject: channel === 'email' ? rendered.subject : undefined,
    body: rendered.body,
    status: 'queued',
    created_by: actor,
    sequence_key: sequenceKey,
    scheduled_at: scheduledAt.toISOString(),
  });
  return { ok: true, communication };
}

/**
 * Авто-отправка по сценариям при смене статуса.
 * Возвращает отчёт: отправлено / в очереди / заблокировано (согласие, нет адреса).
 */
export async function autoSendForStatus(base44, { lead, actor }) {
  const report = { sequence: null, sent: [], queued: [], blocked: [], skipped: [] };

  const sequenceKey = await triggerFor(base44, lead);
  if (!sequenceKey) return report;
  report.sequence = sequenceKey;

  const page = await base44.asServiceRole.entities.SequenceSetting.filter(
    { key: sequenceKey },
    { limit: 20 }
  ).catch(() => null);
  const settings = (page && page.items ? page.items : []).filter(
    (item) => item.auto_send === true && item.is_active !== false
  );
  if (!settings.length) return report;

  const agency = await loadSettings(base44);
  const now = new Date();

  for (const setting of settings) {
    const channel = setting.channel;
    if (!SEQUENCE_CHANNELS.includes(channel)) continue;
    if (!channelAvailable(channel, lead)) {
      report.skipped.push({ channel, reason: 'no_target' });
      continue;
    }
    if (needsConsent(sequenceKey) && !hasConsent(lead)) {
      report.blocked.push({ channel, reason: 'no_consent' });
      continue;
    }

    const template = await loadTemplate(base44, setting.template_key, channel);
    if (!template) {
      report.skipped.push({ channel, reason: 'no_template' });
      continue;
    }

    const delayHours = Number(setting.delay_hours) || 0;
    const base = new Date(now.getTime() + delayHours * 60 * 60 * 1000);
    const scheduledAt = outsideWorkingHours(base, agency) ? nextWorkingStart(base, agency) : base;
    const mustQueue = delayHours > 0 || scheduledAt.getTime() > now.getTime() + 60000;

    if (mustQueue) {
      const queued = await queueSend(base44, { lead, channel, template, actor, sequenceKey, scheduledAt });
      if (queued.ok) report.queued.push({ channel, scheduled_at: scheduledAt.toISOString() });
      else report.skipped.push({ channel, reason: queued.error });
      continue;
    }

    const sent = await sendNow(base44, { lead, channel, template, actor, sequenceKey, settings: agency });
    if (sent.ok) report.sent.push({ channel });
    else if (sent.manual) report.queued.push({ channel, scheduled_at: now.toISOString(), manual: true });
    else report.blocked.push({ channel, reason: sent.error || 'send_failed' });
  }

  return report;
}

/**
 * Отправляет созревшую очередь. Повторная отправка исключена:
 * сообщение берётся только со status = queued и без sent_at.
 * WhatsApp в очереди не отправляется автоматически — остаётся для ручной отправки.
 */
export async function dispatchQueued(base44, { limit = 50 } = {}) {
  const now = new Date();
  const page = await base44.asServiceRole.entities.Communication.filter(
    { status: 'queued', direction: 'out', scheduled_at: { $lte: now.toISOString() } },
    { sort: 'scheduled_at', limit }
  ).catch(() => null);

  const rows = page && page.items ? page.items : [];
  const agency = await loadSettings(base44);
  const result = { checked: rows.length, sent: 0, failed: 0, manual: 0, skipped: 0, details: [] };

  for (const row of rows) {
    if (row.status !== 'queued' || row.sent_at) {
      result.skipped += 1;
      continue;
    }
    if (row.channel === 'whatsapp') {
      result.manual += 1;
      continue;
    }

    const lead = await base44.asServiceRole.entities.Lead.get(row.lead_id).catch((e) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!lead) {
      await base44.asServiceRole.entities.Communication.update(row.id, {
        status: 'failed',
        provider_id: 'lead_missing',
      });
      result.failed += 1;
      continue;
    }

    const template = { subject: row.subject || '', body: row.body || '' };
    const outcome = await sendNow(base44, {
      lead,
      channel: row.channel,
      template,
      actor: 'sequence-worker',
      sequenceKey: row.sequence_key || '',
      settings: agency,
      write: false,
    });

    if (outcome.ok) {
      await base44.asServiceRole.entities.Communication.update(row.id, {
        status: 'sent',
        sent_at: new Date().toISOString(),
        provider_id: outcome.providerId || '',
      });
      result.sent += 1;
      result.details.push({ channel: row.channel, lead: lead.name, ok: true });
    } else {
      await base44.asServiceRole.entities.Communication.update(row.id, {
        status: 'failed',
        provider_id: outcome.error || 'send_failed',
      });
      result.failed += 1;
      result.details.push({ channel: row.channel, lead: lead.name, ok: false, error: outcome.error });
    }
  }

  return result;
}