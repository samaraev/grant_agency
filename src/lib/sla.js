// Норматив первого ответа считается только по рабочим часам агентства (МСК).
import { normalizeStatus } from '@/lib/leadStatus';

const MSK_OFFSET_MIN = 180;
const DAY_MS = 86400000;
const CLOSED = ['non_target', 'deal_closed'];

function toMinutes(value, fallback) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || ''));
  if (!match) return fallback;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Рабочие минуты между двумя моментами: Пн–Пт, окно из AdminSettings. */
export function workingMinutesBetween(from, to, settings = {}) {
  const start = toMinutes(settings.working_hours_start, 600);
  const end = toMinutes(settings.working_hours_end, 1200);
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs || end <= start) return 0;

  let total = 0;
  const firstDay = Math.floor((fromMs + MSK_OFFSET_MIN * 60000) / DAY_MS) * DAY_MS - MSK_OFFSET_MIN * 60000;
  for (let i = 0; i < 400; i += 1) {
    const dayStart = firstDay + i * DAY_MS;
    if (dayStart >= toMs) break;
    const weekday = new Date(dayStart + MSK_OFFSET_MIN * 60000).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    const windowStart = dayStart + start * 60000;
    const windowEnd = dayStart + end * 60000;
    const a = Math.max(fromMs, windowStart);
    const b = Math.min(toMs, windowEnd);
    if (b > a) total += (b - a) / 60000;
  }
  return Math.round(total);
}

/** Состояние SLA первого ответа по обращению. */
export function slaState(lead, settings = {}) {
  const sla = Number(settings.first_response_sla_minutes) || 30;
  if (lead?.first_response_at) return { answered: true, overdue: false, worked: null, sla };
  if (CLOSED.includes(normalizeStatus(lead?.status))) {
    return { answered: false, overdue: false, worked: null, sla };
  }
  const worked = workingMinutesBetween(lead?.created_date, new Date(), settings);
  return { answered: false, overdue: worked > sla, worked, sla };
}

export function slaList(leads, settings = {}) {
  return leads
    .map((lead) => ({ lead, ...slaState(lead, settings) }))
    .filter((row) => row.overdue)
    .sort((a, b) => b.worked - a.worked);
}

export function formatWorked(minutes) {
  if (minutes === null || minutes === undefined) return '—';
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}