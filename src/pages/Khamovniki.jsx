import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import ClusterHero from '@/components/cluster/ClusterHero';
import ClusterReasons from '@/components/cluster/ClusterReasons';
import ClusterProcess from '@/components/cluster/ClusterProcess';
import ClusterLimits from '@/components/cluster/ClusterLimits';
import ClusterContact from '@/components/cluster/ClusterContact';
import { useBuildingList } from '@/hooks/useBuildings';
import { applySeo } from '@/lib/seo';
import { track } from '@/lib/track';
import { t } from '@/lib/i18n';
import { useLang } from '@/components/LanguageProvider';

export default function Khamovniki() {
  const { buildings } = useBuildingList({ limit: 200 });
  const { settings } = useOutletContext() || {};
  const { lang } = useLang();

  useEffect(() => {
    return applySeo({ ...t.meta.cluster, path: '/khamovniki' });
  }, [lang]);

  useEffect(() => {
    track(t.track.pageView, { page: 'cluster_khamovniki' });
  }, []);

  return (
    <div>
      <ClusterHero buildings={buildings} />
      <ClusterReasons />
      <ClusterProcess />
      <ClusterLimits />
      <ClusterContact settings={settings || t.settings} />
    </div>
  );
}