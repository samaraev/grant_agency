import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { dateLocale, t } from '@/lib/i18n';

const FIELD =
  'h-[38px] w-full border border-white/10 bg-[#1f272b] px-3 text-[12.5px] text-white focus:border-[#c8102e] focus:outline-none';

const EMPTY = { type: 'in_apartment', startsAt: '', address: '', responsible: '', status: 'planned' };

export default function LeadMeetingsTab({ lead }) {
  const copy = t.admin.leads.workspace.meetings;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    base44.entities.Meeting.filter({ lead_id: lead.id }, { sort: '-starts_at', limit: 100 })
      .then((page) => setItems(page?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [lead.id]);

  const add = async () => {
    if (!form.startsAt) return;
    setSaving(true);
    try {
      await base44.entities.Meeting.create({
        lead_id: lead.id,
        type: form.type,
        starts_at: new Date(form.startsAt).toISOString(),
        address: form.address,
        responsible: form.responsible,
        status: form.status,
      });
      setForm(EMPTY);
      load();
    } finally {
      setSaving(false);
    }
  };

  const update = async (meeting, patch) => {
    const updated = await base44.entities.Meeting.update(meeting.id, patch);
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  return (
    <div className="space-y-4">
      <div className="border border-white/10 bg-[#1f272b] p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            aria-label={copy.type}
            className={FIELD}
          >
            {Object.entries(copy.types).map(([key, label]) => (
              <option key={key} value={key} className="bg-[#1f272b]">{label}</option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            aria-label={copy.starts}
            className={FIELD}
          />
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder={copy.address}
            className={FIELD}
          />
          <input
            value={form.responsible}
            onChange={(e) => setForm({ ...form, responsible: e.target.value })}
            placeholder={copy.responsible}
            className={FIELD}
          />
        </div>
        <button
          type="button"
          onClick={add}
          disabled={saving || !form.startsAt}
          className="mt-3 min-h-[38px] bg-[#c8102e] px-4 text-[12.5px] font-semibold text-white disabled:opacity-50"
        >
          {saving ? copy.saving : copy.add}
        </button>
      </div>

      {loading ? (
        <p className="text-[13px] text-[#8f9a9f]">{t.admin.common.loading}</p>
      ) : items.length ? (
        <ul className="space-y-3">
          {items.map((meeting) => (
            <li key={meeting.id} className="border border-white/10 bg-[#1f272b] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[13px] text-white">
                  {meeting.starts_at ? new Date(meeting.starts_at).toLocaleString(dateLocale()) : '—'}
                </span>
                <span className="text-[11.5px] uppercase tracking-[0.1em] text-[#c9b28c]">
                  {copy.types[meeting.type] || meeting.type}
                </span>
                <select
                  value={meeting.status || 'planned'}
                  onChange={(e) => update(meeting, { status: e.target.value })}
                  aria-label={copy.status}
                  className="ml-auto h-[32px] border border-white/10 bg-[#263033] px-2 text-[12px] text-white focus:border-[#c8102e] focus:outline-none"
                >
                  {Object.entries(copy.statuses).map(([key, label]) => (
                    <option key={key} value={key} className="bg-[#1f272b]">{label}</option>
                  ))}
                </select>
              </div>
              {meeting.address || meeting.responsible ? (
                <div className="mt-2 text-[12.5px] text-[#b0b8bc]">
                  {[meeting.address, meeting.responsible].filter(Boolean).join(' · ')}
                </div>
              ) : null}
              <textarea
                defaultValue={meeting.result_notes || ''}
                onBlur={(e) => {
                  if (e.target.value !== (meeting.result_notes || '')) update(meeting, { result_notes: e.target.value });
                }}
                rows={2}
                placeholder={copy.result}
                className="mt-2 w-full resize-none border border-white/10 bg-[#263033] p-2.5 text-[12.5px] text-white focus:border-[#c8102e] focus:outline-none"
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-[#8f9a9f]">{copy.empty}</p>
      )}
    </div>
  );
}