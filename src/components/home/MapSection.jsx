import BuildingsMap from '@/components/BuildingsMap';
import SectionHeading from '@/components/SectionHeading';
import { useLead } from '@/components/LeadProvider';
import { t } from '@/lib/i18n';

export default function MapSection({ buildings = [] }) {
  const { openLead } = useLead();
  const withCoords = buildings.filter((item) => item.latitude && item.longitude);

  return (
    <section className="border-y border-white/10 bg-[#1f272b]">
      <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
        <SectionHeading
          marker={t.home.map.marker}
          title={t.home.map.title}
          subtitle={t.home.map.subtitle}
        />
        <div className="mt-10">
          <BuildingsMap
            buildings={withCoords.length ? withCoords : buildings}
            onContact={(building) =>
              openLead({ type: 'buyer_check', address: building.address, building_id: building.id })
            }
          />
        </div>
      </div>
    </section>
  );
}