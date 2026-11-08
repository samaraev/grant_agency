import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';

/** Настройки сайта из сущности SiteSettings; до загрузки — значения по умолчанию. */
export function useSiteSettings() {
  const [settings, setSettings] = useState(() => t.settings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    base44.entities.SiteSettings.list({ limit: 1 })
      .then((page) => {
        const items = page?.items || page || [];
        if (alive && items.length) setSettings({ ...t.settings, ...items[0] });
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { settings, loading };
}

export default useSiteSettings;