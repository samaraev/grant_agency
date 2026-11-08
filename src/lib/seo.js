import { t } from '@/lib/i18n';

const SITE_URL = 'https://rieltorcenter.ru';

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Устанавливает SEO-мета для страницы. Возвращает функцию очистки
 * для структурированных данных.
 */
export function applySeo({ title, description, image, path, jsonLd, robots = 'index, follow' }) {
  document.title = title;
  const canonical = `${SITE_URL}${path || '/'}`;
  // Технический домен платформы закрываем от индексации, канонический адрес не меняем.
  const isPlatformHost =
    typeof window !== 'undefined' && window.location.hostname.endsWith('base44.app');
  const robotsValue = isPlatformHost ? 'noindex, nofollow' : robots;

  upsertMeta('name', 'description', description);
  upsertMeta('name', 'robots', robotsValue);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('property', 'og:locale', t.locale === 'en' ? 'en_US' : 'ru_RU');
  upsertMeta('property', 'og:site_name', `${t.brand.name} — ${t.brand.sub}`);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  if (image) {
    upsertMeta('property', 'og:image', image);
    upsertMeta('name', 'twitter:image', image);
  }
  upsertLink('canonical', canonical);

  const nodes = [];
  if (jsonLd) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.seo = 'jsonld';
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    nodes.push(script);
  }
  return () => nodes.forEach((node) => node.remove());
}

export const siteUrl = SITE_URL;

/** Готовые структурированные данные для организации / агентства. */
export function organizationJsonLd(settings) {
  return {
    '@context': 'https://schema.org',
    '@type': ['RealEstateAgent', 'LocalBusiness'],
    name: `${t.brand.name} — ${t.brand.sub}`,
    url: SITE_URL,
    description: t.footer.about,
    telephone: settings?.phone,
    email: settings?.email,
    areaServed: 'Москва и Московская область',
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings?.office_address,
      addressLocality: 'Москва',
      addressCountry: 'RU',
    },
    openingHours: settings?.working_hours,
  };
}