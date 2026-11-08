import { base44 } from '@/api/base44Client';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
const COUNTER_KEY = 'grant_metrica';
const CLIENT_KEY = 'grant_client_id';

export function getSessionId() {
  try {
    let id = window.sessionStorage.getItem('grant_sid');
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem('grant_sid', id);
    }
    return id;
  } catch {
    return null;
  }
}

export function getUtm() {
  const params = new URLSearchParams(window.location.search);
  const source = {};
  UTM_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) source[key] = value.slice(0, 120);
  });
  if (Object.keys(source).length) {
    try {
      window.sessionStorage.setItem('grant_utm', JSON.stringify(source));
    } catch {
      /* noop */
    }
  }
  try {
    const stored = window.sessionStorage.getItem('grant_utm');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return source;
  }
}

/** Номер счётчика Метрики приходит из настроек сайта — храним его для целей и ClientID. */
export function setMetricaCounter(id) {
  try {
    if (id) window.sessionStorage.setItem(COUNTER_KEY, String(id));
    else window.sessionStorage.removeItem(COUNTER_KEY);
  } catch {
    /* noop */
  }
}

export function getMetricaCounter() {
  try {
    return window.sessionStorage.getItem(COUNTER_KEY);
  } catch {
    return null;
  }
}

/** ClientID Яндекс.Метрики; кэшируется в sessionStorage. */
export function getClientId() {
  return new Promise((resolve) => {
    try {
      const cached = window.sessionStorage.getItem(CLIENT_KEY);
      if (cached) {
        resolve(cached);
        return;
      }
    } catch {
      /* noop */
    }
    const counter = getMetricaCounter();
    if (!counter || typeof window.ym !== 'function') {
      resolve(null);
      return;
    }
    let settled = false;
    window.ym(counter, 'getClientID', (id) => {
      if (settled) return;
      settled = true;
      const value = id ? String(id) : null;
      if (value) {
        try {
          window.sessionStorage.setItem(CLIENT_KEY, value);
        } catch {
          /* noop */
        }
      }
      resolve(value);
    });
    window.setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, 1500);
  });
}

/**
 * Единая точка трекинга событий интерфейса: пишет в сущность Events
 * и, если задан счётчик, отправляет цель в Яндекс.Метрику.
 */
export function track(eventName, props = {}) {
  try {
    base44.entities.Events.create({
      event_name: eventName,
      path: window.location.pathname,
      session_id: getSessionId(),
      building_id: props.building_id || null,
      search_query: props.query ? String(props.query).slice(0, 160) : null,
      matched: typeof props.matched === 'boolean' ? props.matched : null,
      meta: JSON.stringify(props).slice(0, 1200),
    }).catch(() => {});
  } catch {
    /* трекинг не должен ломать интерфейс */
  }

  const counter = getMetricaCounter();
  if (counter && typeof window.ym === 'function') {
    try {
      window.ym(counter, 'reachGoal', eventName);
    } catch {
      /* noop */
    }
  }
}

export function trackPageView() {
  track('page_view', { title: document.title });
}