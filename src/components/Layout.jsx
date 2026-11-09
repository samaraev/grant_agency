import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LeadProvider from '@/components/LeadProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useThirdPartyTags } from '@/hooks/useThirdPartyTags';
import { initMetrica } from '@/lib/track';

export default function Layout() {
  const { settings } = useSiteSettings();
  useThirdPartyTags(settings);

  // Счётчик Метрики подключается только при включённой интеграции.
  useEffect(() => {
    initMetrica();
  }, []);

  return (
    <LeadProvider>
      <div className="flex min-h-screen flex-col bg-[#1a2025]">
        <Header settings={settings} />
        <main className="flex-1">
          <Outlet context={{ settings }} />
        </main>
        <Footer settings={settings} />
      </div>
    </LeadProvider>
  );
}