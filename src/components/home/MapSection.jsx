import BuildingsMap from '@/components/BuildingsMap';
import SectionHeading from '@/components/SectionHeading';
import { useLead } from '@/components/LeadProvider';
import { featuredBuildings } from '@/lib/khamovniki';
import { t } from '@/lib/i18n';

export default function MapSection({ buildings = [] }) {
  const { openLead } = useLead();
  const m = t.homepage.map;
  const featured = featuredBuildings(buildings);
  const ordered = [...featured, ...buildings.filter((item) => !item.is_featured)];
  const withCoords = ordered.filter((item) => item.latitude && item.longitude);

  return (
    <section id="map" className="border-y border-white/10 bg-[#1f272b]">
      <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
        <SectionHeading marker={m.marker} title={m.title} subtitle={m.subtitle} />
        <div className="mt-10">
          <BuildingsMap
            buildings={withCoords.length ? withCoords : ordered}
            onContact={(building) =>
              openLead({ type: 'buyer_check', address: building.address, building_id: building.id })
            }
          />
        </div>
        <p className="mt-5 max-w-3xl text-[12px] leading-relaxed text-[#778287]">
          {m.note}{' '}
          <a href="#videos" className="link-underline text-[#c9b28c]">
            {m.videoLink}
          </a>
        </p>
      </div>
    </section>
  );
}