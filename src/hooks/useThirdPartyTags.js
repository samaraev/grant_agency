import { useEffect } from 'react';
import { setMetricaCounter } from '@/lib/track';

const METRICA_SRC = 'https://mc.yandex.ru/metrika/tag.js';

/**
 * Подключает внешние счётчики из настроек сайта: Яндекс.Метрику (только если
 * задан номер счётчика) и код подтверждения Google Search Console.
 */
export function useThirdPartyTags(settings) {
  const counterId = settings?.metrica_counter_id ? String(settings.metrica_counter_id).trim() : '';
  const gscVerification = settings?.gsc_verification ? String(settings.gsc_verification).trim() : '';

  useEffect(() => {
    if (!counterId) return undefined;
    setMetricaCounter(counterId);

    const init = () => {
      if (typeof window.ym !== 'function') return;
      window.ym(counterId, 'init', {
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: false,
      });
    };

    if (typeof window.ym === 'function') {
      init();
      return undefined;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = METRICA_SRC;
    script.onload = init;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [counterId]);

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