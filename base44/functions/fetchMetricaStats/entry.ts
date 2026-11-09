import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { requireAdminOrDemo } from '../../shared/guards.ts';
import { readMetricaSettings, tokenPresent, metricaToken } from '../../shared/metrica.ts';

const API = 'https://api-metrika.yandex.net/stat/v1/data';
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; payload: unknown }>();

function isoDate(value: Date) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
  return match ? String(value).trim() : '';
}

async function callApi(
  token: string,
  counterId: string,
  params: Record<string, string>
): Promise<any> {
  const query = new URLSearchParams({ ids: counterId, accuracy: 'full', ...params });
  const response = await fetch(`${API}?${query.toString()}`, {
    headers: { Authorization: `OAuth ${token}` },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`metrica_api_${response.status}:${detail.slice(0, 200)}`);
  }
  return response.json();
}

function stripQuery(url: string) {
  const clean = String(url || '').trim();
  if (!clean) return '/';
  try {
    const parsed = new URL(clean, 'https://placeholder.local');
    return parsed.pathname || '/';
  } catch {
    return clean.split('?')[0] || '/';
  }
}

/**
 * Данные Метрики за период: визиты, посетители, достижения целей, источники,
 * страницы входа, устройства. Ответ кэшируется в памяти на 10 минут.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const denied = await requireAdminOrDemo(base44);
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    const settings = await readMetricaSettings(base44);
    const hasToken = tokenPresent();

    if (body?.probe === true) {
      return Response.json({
        ok: true,
        probe: true,
        token_present: hasToken,
        metrica_enabled: settings.enabled,
        counter_id: settings.counterId,
      });
    }

    // Сначала конфигурация, потом токен: админу полезнее увидеть,
    // что счётчик выключен, чем сообщение про секрет.
    if (!settings.enabled || !settings.counterId) {
      return Response.json({
        ok: false,
        reason: 'metrica_not_configured',
        token_present: hasToken,
        metrica_enabled: settings.enabled,
        counter_id: settings.counterId,
      });
    }

    if (!hasToken) {
      return Response.json({
        ok: false,
        reason: 'no_metrica_token',
        token_present: false,
        metrica_enabled: settings.enabled,
        counter_id: settings.counterId,
      });
    }

    const today = isoDate(new Date());
    const monthAgo = isoDate(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000));
    const dateFrom = parseDate(body?.date_from) || monthAgo;
    const dateTo = parseDate(body?.date_to) || today;
    const key = `${settings.counterId}|${dateFrom}|${dateTo}`;

    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return Response.json({ ...(cached.payload as object), cached: true });
    }

    const token = metricaToken();
    const goalEntries = Object.entries(settings.goals || {})
      .map(([goalKey, raw]) => ({ goalKey, id: Number(raw) }))
      .filter((entry) => Number.isFinite(entry.id) && entry.id > 0);

    const goalMetrics = goalEntries.map((entry) => `ym:s:goal${Math.round(entry.id)}reaches`);
    const totalsResponse = await callApi(token, settings.counterId, {
      date1: dateFrom,
      date2: dateTo,
      metrics: ['ym:s:visits', 'ym:s:users', ...goalMetrics].join(','),
    });
    const totalsRow = totalsResponse?.data?.[0]?.metrics || [];

    const [sourcesResponse, pagesResponse, devicesResponse] = await Promise.all([
      callApi(token, settings.counterId, {
        date1: dateFrom,
        date2: dateTo,
        metrics: 'ym:s:visits',
        dimensions: 'ym:s:lastsignUTMSource',
        sort: '-ym:s:visits',
        limit: '50',
      }).catch(() => null),
      callApi(token, settings.counterId, {
        date1: dateFrom,
        date2: dateTo,
        metrics: 'ym:s:visits',
        dimensions: 'ym:s:startURL',
        sort: '-ym:s:visits',
        limit: '50',
      }).catch(() => null),
      callApi(token, settings.counterId, {
        date1: dateFrom,
        date2: dateTo,
        metrics: 'ym:s:visits',
        dimensions: 'ym:s:deviceCategory',
      }).catch(() => null),
    ]);

    const payload = {
      ok: true,
      token_present: true,
      counter_id: settings.counterId,
      date_from: dateFrom,
      date_to: dateTo,
      generated_at: new Date().toISOString(),
      totals: {
        visits: Number(totalsRow[0]) || 0,
        users: Number(totalsRow[1]) || 0,
      },
      goals: goalEntries.map((entry, index) => ({
        key: entry.goalKey,
        goal_id: Math.round(entry.id),
        reaches: Number(totalsRow[index + 2]) || 0,
      })),
      sources: (sourcesResponse?.data || []).map((row: any) => ({
        source: row?.dimensions?.[0]?.name || row?.dimensions?.[0]?.id || '—',
        visits: Number(row?.metrics?.[0]) || 0,
      })),
      pages: (pagesResponse?.data || []).map((row: any) => ({
        path: stripQuery(row?.dimensions?.[0]?.name || row?.dimensions?.[0]?.id || ''),
        visits: Number(row?.metrics?.[0]) || 0,
      })),
      devices: (devicesResponse?.data || []).map((row: any) => ({
        device: row?.dimensions?.[0]?.name || row?.dimensions?.[0]?.id || '—',
        visits: Number(row?.metrics?.[0]) || 0,
      })),
    };

    cache.set(key, { at: Date.now(), payload });
    return Response.json(payload);
  } catch (error) {
    return Response.json({ ok: false, reason: 'metrica_error', detail: error.message });
  }
}