import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { dateLocale, t } from '@/lib/i18n';
import { statusLabel } from '@/lib/leadStatus';

export default function LeadHistoryTab({ lead }) {
  const copy = t.admin.leads.workspace.history;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.StatusHistory.filter({ lead_id: lead.id }, { sort: '-created_date', limit: 200 })
      .then((page) => setItems(page?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [lead.id]);

  if (loading) return <p className="text-[13px] text-[#8f9a9f]">{t.admin.common.loading}</p>;
  if (!items.length) return <p className="text-[13px] text-[#8f9a9f]">{copy.empty}</p>;

  return (
    <ul className="divide-y divide-white/8 border border-white/10">
      {items.map((item) => (
        <li key={item.id} className="bg-[#1a2025] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
            <span className="text-[#8f9a9f]">{item.from_status ? statusLabel(item.from_status, t) : '—'}</span>
            <span className="text-[#5f696d]">→</span>
            <span className="text-white">{statusLabel(item.to_status, t)}</span>
            <span className="ml-auto text-[11.5px] text-[#6f7a7f]">
              {new Date(item.created_date).toLocaleString(dateLocale())}
            </span>
          </div>
          {item.note ? <p className="mt-1 text-[12.5px] text-[#b0b8bc]">{item.note}</p> : null}
          {item.changed_by ? (
            <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-[#5f696d]">
              {copy.by}: {item.changed_by}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}