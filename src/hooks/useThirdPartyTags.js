import { useEffect } from 'react';

/**
 * Код подтверждения Google Search Console из настроек сайта.
 * Счётчик Яндекс.Метрики подключается отдельно — через initMetrica()
 * в Layout, потому что он включается флагом metrica_enabled.
 */
export function useThirdPartyTags(settings) {
  const gscVerification = settings?.gsc_verification ? String(settings.gsc_verification).trim() : '';

  useEffect(() => {
    if (!gscVerification) return undefined;
    let element = document.head.querySelector('meta[name="google-site-verification"]');
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute('name', 'google-site-verification');
      document.head.appendChild(element);
    }
    element.setAttribute('content', gscVerification);
    return () => {
      element?.remove();
    };
  }, [gscVerification]);
}

export default useThirdPartyTags;