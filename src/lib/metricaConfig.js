import { base44 } from '@/api/base44Client';

/**
 * Публичная конфигурация счётчика (номер и сопоставленные цели) из
 * IntegrationSettings. Токена здесь нет и быть не может.
 * Конфигурация нужна на каждой странице сайта, поэтому кэшируем её на сессию.
 */
const CACHE_KEY = 'grant_metrica_config';

let memory = null;
let pending = null;

function readCache() {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(value) {
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

/** Загружает конфигурацию Метрики один раз за сессию. */
export function loadMetricaConfig() {
  if (memory) return Promise.resolve(memory);
  if (pending) return pending;

  const cached = readCache();
  if (cached) {
    memory = cached;
    return Promise.resolve(cached);
  }

  const empty = { enabled: false, counter_id: '', goals: {} };
  pending = base44.functions
    .invoke('metricaConfig', {})
    .then((res) => {
      const data = res?.data || {};
      const config = {
        enabled: data.enabled === true,
        counter_id: data.counter_id ? String(data.counter_id) : '',
        goals: data.goals && typeof data.goals === 'object' ? data.goals : {},
      };
      memory = config;
      writeCache(config);
      return config;
    })
    .catch(() => {
      memory = empty;
      return empty;
    })
    .finally(() => {
      pending = null;
    });

  return pending;
}

/** Уже загруженная конфигурация (null, пока не загрузилась). */
export function getMetricaConfigSync() {
  return memory || readCache();
}