/**
 * Яндекс.Метрика: общая серверная логика для функций.
 *
 * Токен OAuth хранится ТОЛЬКО в секретах приложения (METRICA_OAUTH_TOKEN).
 * Он никогда не попадает в SiteSettings, IntegrationSettings, клиентский код
 * или ответы функций — наружу отдаётся лишь признак «токен есть/нет».
 */
import { writeAudit } from './audit.ts';

export const TOKEN_SECRET = 'METRICA_OAUTH_TOKEN';

/** Все цели, которые можно сопоставить в настройках. */
export const GOAL_KEYS = [
  'lead_submit',
  'phone_click',
  'form_start',
  'qualified_conversation',
  'contract_signed',
  'deal_closed',
];

/** Цели, которые отправляются из браузера через ym('reachGoal'). */
export const CLIENT_GOAL_KEYS = ['lead_submit', 'phone_click', 'form_start'];

/** Цели, которые отправляются офлайн-конверсией по ClientID. */
export const OFFLINE_GOAL_KEYS = ['qualified_conversation', 'contract_signed', 'deal_closed'];

export function metricaToken(): string {
  try {
    return String(Deno.env.get(TOKEN_SECRET) || '').trim();
  } catch {
    return '';
  }
}

export function tokenPresent(): boolean {
  return metricaToken().length > 0;
}

/** Единственная запись настроек интеграций. */
export async function readMetricaSettings(base44: any) {
  const page = await base44.asServiceRole.entities.IntegrationSettings.list({ limit: 1 }).catch(
    () => ({ items: [] })
  );
  const record = page?.items?.[0] || null;
  const goals =
    record?.metrica_goal_ids && typeof record.metrica_goal_ids === 'object'
      ? record.metrica_goal_ids
      : {};
  return {
    record,
    counterId: String(record?.metrica_counter_id || '').trim(),
    enabled: record?.metrica_enabled === true,
    goals: goals as Record<string, unknown>,
  };
}

export function goalId(settings: { goals?: Record<string, unknown> }, key: string): number | null {
  const raw = settings?.goals?.[key];
  const num = Number(raw);
  return Number.isFinite(num) && num > 0 ? Math.round(num) : null;
}

export function alreadySent(lead: any, goalKey: string): boolean {
  const list = Array.isArray(lead?.offline_conversions_sent) ? lead.offline_conversions_sent : [];
  return list.some((item: any) => item && item.goal_key === goalKey);
}

/** Метрика ждёт время в часовом поясе счётчика: агентство работает по Москве. */
export function moscowStamp(date: Date): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export type OfflineResult = {
  ok: boolean;
  reason?: string;
  goal_id?: number;
  goal_key?: string;
  value?: number | null;
  status?: number;
  detail?: string;
};

/**
 * Офлайн-конверсия по ClientID. Ничего не отправляет, если цель уже уходила
 * (offline_conversions_sent), поэтому повторный вызов безопасен.
 */
export async function sendOfflineConversion(
  base44: any,
  { lead, goalKey, actor }: { lead: any; goalKey: string; actor?: string }
): Promise<OfflineResult> {
  const settings = await readMetricaSettings(base44);
  const token = metricaToken();

  if (!settings.enabled || !settings.counterId) return { ok: false, reason: 'metrica_not_configured' };

  const gid = goalId(settings, goalKey);
  if (!gid) return { ok: false, reason: 'metrica_not_configured' };

  if (!lead?.client_id) {
    await writeAudit(base44, {
      actor,
      action: 'metrica.offline_conversion_failed',
      entity: 'Lead',
      entity_id: lead?.id,
      meta: { goal_key: goalKey, reason: 'no_client_id' },
    });
    return { ok: false, reason: 'no_client_id' };
  }

  // Повторную отправку отсекаем до запроса: одна цель на обращение уходит один раз.
  if (alreadySent(lead, goalKey)) {
    return { ok: false, reason: 'already_sent', goal_key: goalKey, goal_id: gid };
  }

  // Токен нужен только для самого запроса в Метрику: без него причина отказа
  // честно сообщается, но данные обращения проверяются раньше.
  if (!token) return { ok: false, reason: 'no_metrica_token' };

  const value =
    goalKey === 'deal_closed' && Number(lead.deal_value) > 0 ? Number(lead.deal_value) : null;

  const conversion: Record<string, unknown> = {
    client_id_type: 'CLIENT_ID',
    client_id: String(lead.client_id),
    goal_id: gid,
    date_time: moscowStamp(new Date()),
  };
  if (value !== null) {
    conversion.price = value;
    conversion.currency = String(lead.deal_currency || 'RUB');
  }

  const url = `https://api-metrika.yandex.net/management/v1/counter/${encodeURIComponent(
    settings.counterId
  )}/offline_conversions/upload?client_id_type=CLIENT_ID`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `OAuth ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ offline_conversions: [conversion] }),
    });
  } catch (error) {
    await writeAudit(base44, {
      actor,
      action: 'metrica.offline_conversion_failed',
      entity: 'Lead',
      entity_id: lead.id,
      meta: { goal_key: goalKey, goal_id: gid, reason: String((error as Error).message || error) },
    });
    return { ok: false, reason: 'metrica_error', detail: String((error as Error).message || error) };
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    await writeAudit(base44, {
      actor,
      action: 'metrica.offline_conversion_failed',
      entity: 'Lead',
      entity_id: lead.id,
      meta: { goal_key: goalKey, goal_id: gid, status: response.status, detail: detail.slice(0, 400) },
    });
    return { ok: false, reason: 'metrica_error', status: response.status, detail: detail.slice(0, 400) };
  }

  const at = new Date().toISOString();
  const sentList = Array.isArray(lead.offline_conversions_sent)
    ? [...lead.offline_conversions_sent]
    : [];
  sentList.push({ goal_key: goalKey, at });

  // Отметку ставим первым делом: она защищает от повторной отправки.
  await base44.asServiceRole.entities.Lead.update(lead.id, {
    offline_conversions_sent: sentList,
  }).catch(() => null);

  await base44.asServiceRole.entities.Communication.create({
    lead_id: lead.id,
    channel: 'note',
    direction: 'out',
    body: `Offline conversion sent to Metrica: ${goalKey}`,
    status: 'sent',
    created_by: actor || 'demo',
    sent_at: at,
  }).catch(() => null);

  await writeAudit(base44, {
    actor,
    action: 'metrica.offline_conversion',
    entity: 'Lead',
    entity_id: lead.id,
    meta: { goal_key: goalKey, goal_id: gid, value },
  });

  return { ok: true, goal_key: goalKey, goal_id: gid, value };
}