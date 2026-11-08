import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { dateLocale, t } from '@/lib/i18n';
import { normalizeStatus } from '@/lib/leadStatus';
import { downloadIcs } from '@/lib/ics';

const FIELD =
  'h-[38px] w-full border border-white/10 bg-[#1f272b] px-3 text-[12.5px] text-white focus:border-[#c8102e] focus:outline-none';

const EMPTY = { type: 'in_apartment', startsAt: '', address: '', responsible: '', status: 'planned' };

// Ошибка от сервера может быть строкой или объектом {code, message, details}
const errorText = (error, fallback) => {
  const raw = error?.response?.data?.error ?? error?.response?.data?.message ?? error?.message;
  if (typeof raw === 'string' && raw.trim()) return raw;
  if (raw && typeof raw === 'object') return raw.message || raw.code || fallback;
  return fallback;
};
const CHANNELS = ['sms', 'email', 'telegram'];

export default function LeadMeetingsTab({ lead }) {
  const copy = t.admin.leads.workspace.meetings;
  const comms = t.admin.leads.workspace.comms;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState(null);
  const [channel, setChannel] = useState('sms');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = () => {
    base44.entities.Meeting.filter({ lead_id: lead.id }, { sort: '-starts_at', limit: 100 })
      .then((page) => setItems(page?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [lead.id]);

  const advance = async (status) => {
    try {
      await base44.functions.invoke('changeLeadStatus', {
        lead_id: lead.id,
        status,
        note: status === 'meeting_held' ? copy.heldNote : copy.scheduledNote,
      });
      setNotice(status === 'meeting_held' ? copy.heldNotice : copy.scheduledNotice);
    } catch (error) {
      setNotice(errorText(error, t.admin.leads.transition.error));
    }
  };

  const add = async () => {
    if (!form.startsAt) return;
    setSaving(true);
    try {
      const startsAt = new Date(form.startsAt).toISOString();
      const record = await base44.entities.Meeting.create({
        lead_id: lead.id,
        type: form.type,
        starts_at: startsAt,
        address: form.address,
        responsible: form.responsible,
        status: form.status,
      });
      setForm(EMPTY);
      setPending(record);
      setChannel(lead.phone ? 'sms' : lead.email ? 'email' : 'telegram');
      setMessage(
        copy.confirmTemplate
          .replace('{date}', new Date(startsAt).toLocaleString(dateLocale(), {
            day: '2-digit',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          }))
          .replace('{address}', form.address || lead.address_text || '')
      );
      load();
    } finally {
      setSaving(false);
    }
  };

  const sendConfirmation = async () => {
    if (!pending) return;
    setBusy(true);
    setNotice('');
    try {
      if (channel === 'sms' && lead.phone) {
        const response = await base44.functions.invoke('sendSms', { lead_id: lead.id, body: message });
        if (!response?.data?.ok) {
          setNotice(errorText({ response }, comms.manualHint));
        }
      } else if (channel === 'email' && lead.email) {
        const response = await base44.functions.invoke('sendEmail', {
          lead_id: lead.id,
          subject: copy.confirmSubject,
          body: message,
        });
        if (!response?.data?.ok) {
          setNotice(errorText({ response }, comms.manualHint));
        }
      } else if (channel === 'telegram' && lead.telegram_username) {
        window.open(`https://t.me/${lead.telegram_username.replace('@', '')}`, '_blank', 'noopener');
        await base44.entities.Communication.create({
          lead_id: lead.id,
          channel: 'telegram',
          direction: 'out',
          body: message,
          status: 'sent',
        });
      }
      await advance('meeting_scheduled');
      setPending(null);
    } finally {
      setBusy(false);
    }
  };

  const update = async (meeting, patch) => {
    const updated = await base44.entities.Meeting.update(meeting.id, patch);
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    if (patch.status === 'held' && normalizeStatus(lead.status) === 'meeting_scheduled') {
      await advance('meeting_held');
    }
  };

  const skipConfirmation = async () => {
    setPending(null);
    await advance('meeting_scheduled');
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

      {pending ? (
        <div className="border border-[#c9b28c]/40 bg-[#1f272b] p-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[#c9b28c]">{copy.confirmTitle}</div>
          <p className="mt-1 text-[11.5px] text-[#8f9a9f]">{copy.confirmHint}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CHANNELS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setChannel(item)}
                className={
                  channel === item
                    ? 'min-h-[32px] bg-[#c8102e] px-3 text-[11.5px] text-white'
                    : 'min-h-[32px] border border-white/15 px-3 text-[11.5px] text-[#b0b8bc]'
                }
              >
                {comms[item] || item}
              </button>
            ))}
          </div>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            aria-label={copy.confirmTitle}
            className="mt-3 w-full resize-none border border-white/10 bg-[#263033] p-2.5 text-[12.5px] text-white focus:border-[#c8102e] focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={sendConfirmation}
              disabled={busy || !message.trim()}
              className="min-h-[34px] bg-[#c8102e] px-3 text-[12px] font-semibold text-white disabled:opacity-50"
            >
              {busy ? copy.sending : copy.confirmSend}
            </button>
            <button
              type="button"
              onClick={skipConfirmation}
              disabled={busy}
              className="min-h-[34px] border border-white/15 px-3 text-[12px] text-white disabled:opacity-40"
            >
              {copy.confirmSkip}
            </button>
          </div>
        </div>
      ) : null}

      {notice ? <p className="text-[12px] text-[#c9b28c]">{notice}</p> : null}

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
              <button
                type="button"
                onClick={() => downloadIcs(meeting, lead)}
                className="mt-2 min-h-[30px] border border-white/15 px-3 text-[11.5px] text-[#c9b28c]"
              >
                {copy.ics}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-[#8f9a9f]">{copy.empty}</p>
      )}
    </div>
  );
}