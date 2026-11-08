import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import KhamovnikiHero from '@/components/home/KhamovnikiHero';
import AgencySection from '@/components/home/AgencySection';
import HelpSection from '@/components/home/HelpSection';
import OwnerFormSection from '@/components/home/OwnerFormSection';
import BuildingsDiscoverySection from '@/components/home/BuildingsDiscoverySection';
import MapSection from '@/components/home/MapSection';
import ServicesSection from '@/components/home/ServicesSection';
import PremiumCollections from '@/components/home/PremiumCollections';
import VideosSection from '@/components/home/VideosSection';
import ContactsSection from '@/components/home/ContactsSection';
import { useLang } from '@/components/LanguageProvider';
import { useBuildingList } from '@/hooks/useBuildings';
import { featuredBuildings } from '@/lib/khamovniki';
import { HERO_IMAGE } from '@/lib/sample-buildings';
import { applySeo, organizationJsonLd } from '@/lib/seo';
import { track } from '@/lib/track';
import { t } from '@/lib/i18n';

export default function Home() {
  const { buildings } = useBuildingList({ limit: 200 });
  const { settings } = useOutletContext() || {};
  const { lang } = useLang();
  const published = buildings.filter((item) => item.is_published !== false);
  const featured = featuredBuildings(published);
  const siteSettings = settings || t.settings;

  useEffect(() => {
    const cleanup = applySeo({
      ...t.meta.home,
      path: '/',
      image: HERO_IMAGE,
      jsonLd: organizationJsonLd(siteSettings),
    });
    return cleanup;
  }, [lang, settings]);

  useEffect(() => {
    track(t.track.pageView, { page: 'home' });
  }, []);

  return (
    <>
      <KhamovnikiHero
        buildings={published}
        settings={siteSettings}
        cover={featured[0] || published[0]}
      />
      <AgencySection />
      <HelpSection />
      <OwnerFormSection />
      <BuildingsDiscoverySection buildings={published} />
      <MapSection buildings={published} />
      <ServicesSection />
      <PremiumCollections buildings={published} />
      <VideosSection />
      <ContactsSection settings={siteSettings} />
    </>
  );
}