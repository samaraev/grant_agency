import { base44 } from '@/api/base44Client';

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
  ['utm_source', 'utm_medium', 'utm_campaign'].forEach((key) => {
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

/**
 * Единая точка трекинга событий интерфейса. Сейчас пишет в сущность Events,
 * позже сюда можно подключить любой внешний аналитический инструмент.
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
}

export function trackPageView() {
  track('page_view', { title: document.title });
}