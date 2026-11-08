import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import KhamovnikiHero from '@/components/home/KhamovnikiHero';
import KnowledgeSection from '@/components/home/KnowledgeSection';
import OwnerReviewSection from '@/components/home/OwnerReviewSection';
import PriorityBuildings from '@/components/home/PriorityBuildings';
import MapSection from '@/components/home/MapSection';
import BuyersSection from '@/components/home/BuyersSection';
import PremiumCollections from '@/components/home/PremiumCollections';
import WhyGrant from '@/components/home/WhyGrant';
import FinalCta from '@/components/home/FinalCta';
import { useLang } from '@/components/LanguageProvider';
import { useBuildingList } from '@/hooks/useBuildings';
import { publishedKhamovniki } from '@/lib/khamovniki';
import { HERO_IMAGE } from '@/lib/sample-buildings';
import { applySeo, organizationJsonLd } from '@/lib/seo';
import { track } from '@/lib/track';
import { t } from '@/lib/i18n';

export default function Home() {
  const { buildings } = useBuildingList({ limit: 200 });
  const { settings } = useOutletContext() || {};
  const { lang } = useLang();
  const published = buildings.filter((item) => item.is_published !== false);
  const khamovniki = publishedKhamovniki(published);

  useEffect(() => {
    const cleanup = applySeo({
      ...t.meta.home,
      path: '/',
      image: HERO_IMAGE,
      jsonLd: organizationJsonLd(settings || t.settings),
    });
    return cleanup;
  }, [lang, settings]);

  useEffect(() => {
    track(t.track.pageView, { page: 'home' });
  }, []);

  return (
    <>
      <KhamovnikiHero buildings={khamovniki.length ? khamovniki : published} settings={settings || t.settings} />
      <KnowledgeSection buildings={khamovniki} />
      <OwnerReviewSection />
      <PriorityBuildings buildings={published} />
      <MapSection buildings={published} />
      <BuyersSection />
      <PremiumCollections buildings={published} />
      <WhyGrant />
      <FinalCta />
    </>
  );
}