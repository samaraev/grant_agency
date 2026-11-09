import { t } from '@/lib/i18n';
import BarRow from '@/components/admin/dashboard/BarRow';

/** Карточка распределения: типы обращений, источники. rows — [{ label, value }]. */
export default function DistributionCard({ title, rows }) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <section className="border border-white/10 bg-[#263033] p-6">
      <div className="eyebrow">{title}</div>
      {rows.length ? (
        <div className="mt-3">
          {rows.map((row) => (
            <BarRow key={row.label} label={row.label} value={row.value} max={max} />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[13px] text-[#8f9a9f]">{t.admin.dashboard.noData}</p>
      )}
    </section>
  );
}