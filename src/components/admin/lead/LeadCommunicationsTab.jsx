import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { dateLocale, t } from '@/lib/i18n';

const FIELD =
  'h-[38px] w-full border border-white/10 bg-[#1f272b] px-3 text-[12.5px] text-white focus:border-[#c8102e] focus:outline-none';

const EMPTY = { channel: 'call', direction: 'out', subject: '', body: '', status: 'sent' };

export default function LeadCommunicationsTab({ lead }) {
  const copy = t.admin.leads.workspace.communications;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    base44.entities.Communication.filter({ lead_id: lead.id }, { sort: '-created_date', limit: 100 })
      .then((page) => setItems(page?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [lead.id]);

  const add = async () => {
    if (!form.subject.trim() && !form.body.trim()) return;
    setSaving(true);
    try {
      await base44.entities.Communication.create({ lead_id: lead.id, ...form });
      setForm(EMPTY);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border border-white/10 bg-[#1f272b] p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={form.channel}
            onChange={(e) => setForm({ ...form, channel: e.target.value })}
            aria-label={copy.channel}
            className={FIELD}
          >
            {Object.entries(copy.channels).map(([key, label]) => (
              <option key={key} value={key} className="bg-[#1f272b]">{label}</option>
            ))}
          </select>
          <select
            value={form.direction}
            onChange={(e) => setForm({ ...form, direction: e.target.value })}
            aria-label={copy.direction}
            className={FIELD}
          >
            {Object.entries(copy.directions).map(([key, label]) => (
              <option key={key} value={key} className="bg-[#1f272b]">{label}</option>
            ))}
          </select>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            aria-label={copy.status}
            className={FIELD}
          >
            {Object.entries(copy.statuses).map(([key, label]) => (
              <option key={key} value={key} className="bg-[#1f272b]">{label}</option>
            ))}
          </select>
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder={copy.subject}
            className={FIELD}
          />
        </div>
        <textarea
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          rows={3}
          placeholder={copy.body}
          className="mt-3 w-full resize-none border border-white/10 bg-[#1f272b] p-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          disabled={saving}
          className="mt-3 min-h-[38px] bg-[#c8102e] px-4 text-[12.5px] font-semibold text-white disabled:opacity-60"
        >
          {saving ? copy.saving : copy.add}
        </button>
      </div>

      {loading ? (
        <p className="text-[13px] text-[#8f9a9f]">{t.admin.common.loading}</p>
      ) : items.length ? (
        <ul className="divide-y divide-white/8 border border-white/10">
          {items.map((item) => (
            <li key={item.id} className="bg-[#1a2025] p-4">
              <div className="flex flex-wrap items-center gap-2 text-[10.5px] uppercase tracking-[0.1em] text-[#8f9a9f]">
                <span className="text-[#c9b28c]">{copy.channels[item.channel] || item.channel}</span>
                <span>{copy.directions[item.direction] || item.direction}</span>
                <span>· {copy.statuses[item.status] || item.status}</span>
                <span className="ml-auto text-[#6f7a7f]">
                  {new Date(item.created_date).toLocaleString(dateLocale())}
                </span>
              </div>
              {item.subject ? <div className="mt-2 text-[13px] font-semibold text-white">{item.subject}</div> : null}
              {item.body ? (
                <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-[#d7dcde]">{item.body}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-[#8f9a9f]">{copy.empty}</p>
      )}
    </div>
  );
}