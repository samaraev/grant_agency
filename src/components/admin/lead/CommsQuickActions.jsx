import { useState } from 'react';
import {
  CalendarClock,
  Flag,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  StickyNote,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import CommsComposeDialog from '@/components/admin/lead/CommsComposeDialog';
import CommsLogDialog from '@/components/admin/lead/CommsLogDialog';

const FIELD =
  'h-[38px] w-full border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';

const CHAT_TEXT = 'Здравствуйте! Это ГРАНТ — Дом изнутри.';

function Action({ icon: Icon, label, onClick, disabled, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={hint || ''}
      className="flex min-h-[46px] items-center justify-center gap-2 border border-white/10 bg-[#1f272b] px-2 text-[11.5px] text-[#d7dcde] transition-colors hover:border-[#c9b28c] hover:text-white disabled:opacity-40"
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </button>
  );
}

/** Быстрые действия по обращению: звонок, SMS, письмо, мессенджеры, заметка. */
export default function CommsQuickActions({ lead, onLogged, onMeetings, onLeadChange }) {
  const copy = t.admin.leads.workspace.comms;
  const [compose, setCompose] = useState('');
  const [log, setLog] = useState(null);
  const [next, setNext] = useState(false);
  const [nextDate, setNextDate] = useState(lead.next_action_date || '');
  const [nextNote, setNextNote] = useState(lead.next_action_note || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [queuedCall, setQueuedCall] = useState(null);

  const telegram = String(lead.telegram_username || '').replace(/^@/, '').trim();
  const digitsOnly = String(lead.phone || '').replace(/\D/g, '');

  const call = async () => {
    if (!lead.phone) return;
    setBusy(true);
    setError('');
    try {
      const response = await base44.functions.invoke('startCall', { lead_id: lead.id });
      const data = response?.data || {};
      if (data.communication) setQueuedCall(data.communication);
      if (data.configured === false) {
        window.location.href = `tel:${lead.phone}`;
      } else if (!data.ok) {
        setError(data.error || '');
      }
      setLog({ channel: 'call', withDuration: true });
    } catch (err) {
      setError(err?.response?.data?.error || '');
      setLog({ channel: 'call', withDuration: true });
    } finally {
      setBusy(false);
    }
  };

  const openChat = (url, channel) => {
    window.open(url, '_blank', 'noopener');
    setLog({ channel, withDuration: false });
  };

  const saveNext = async () => {
    setBusy(true);
    try {
      const updated = await base44.entities.Lead.update(lead.id, {
        next_action_date: nextDate,
        next_action_note: nextNote,
      });
      onLeadChange?.(updated);
      setNext(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Action icon={Phone} label={copy.call} onClick={call} disabled={busy || !lead.phone} hint={copy.noPhone} />
        <Action icon={MessageSquare} label={copy.sms} onClick={() => setCompose('sms')} disabled={!lead.phone} hint={copy.noPhone} />
        <Action icon={Mail} label={copy.email} onClick={() => setCompose('email')} disabled={!lead.email} hint={copy.noEmail} />
        <Action
          icon={Send}
          label={copy.telegram}
          onClick={() => openChat(`https://t.me/${telegram}?text=${encodeURIComponent(CHAT_TEXT)}`, 'telegram')}
          disabled={!telegram}
          hint={copy.noTelegram}
        />
        <Action
          icon={MessageCircle}
          label={copy.whatsapp}
          onClick={() => openChat(`https://wa.me/${digitsOnly}?text=${encodeURIComponent(CHAT_TEXT)}`, 'whatsapp')}
          disabled={!digitsOnly}
          hint={copy.noPhone}
        />
        <Action icon={MessageCircle} label={`${copy.max} · ${copy.maxSoon}`} disabled onClick={() => {}} />
        <Action icon={StickyNote} label={copy.note} onClick={() => setLog({ channel: 'note', withDuration: false })} />
        <Action icon={CalendarClock} label={copy.meeting} onClick={() => onMeetings?.()} />
        <Action
          icon={Flag}
          label={copy.next}
          onClick={() => {
            setNextDate(lead.next_action_date || '');
            setNextNote(lead.next_action_note || '');
            setNext(true);
          }}
        />
      </div>

      {error ? <p className="mt-2 text-[12px] text-[#c9b28c]">{error}</p> : null}

      <CommsComposeDialog
        open={Boolean(compose)}
        channel={compose || 'sms'}
        lead={lead}
        onClose={() => setCompose('')}
        onLogged={onLogged}
      />

      <CommsLogDialog
        open={Boolean(log)}
        channel={log?.channel || 'call'}
        withDuration={Boolean(log?.withDuration)}
        lead={lead}
        existing={queuedCall}
        onClose={() => {
          setLog(null);
          setQueuedCall(null);
        }}
        onSaved={(record) => {
          setLog(null);
          setQueuedCall(null);
          onLogged?.(record);
        }}
      />

      <Dialog open={next} onOpenChange={(open) => !open && setNext(false)}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-[420px] border-white/10 bg-[#263033] p-0">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="eyebrow">{copy.nextTitle}</div>
            <DialogTitle className="mt-2 text-[16px] font-bold text-white">{lead.name}</DialogTitle>
          </div>
          <div className="space-y-3 px-5 py-5">
            <input
              type="date"
              value={nextDate}
              onChange={(event) => setNextDate(event.target.value)}
              aria-label={copy.nextDate}
              className={FIELD}
            />
            <input
              value={nextNote}
              onChange={(event) => setNextNote(event.target.value)}
              placeholder={copy.nextNote}
              aria-label={copy.nextNote}
              className={FIELD}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={saveNext}
                disabled={busy}
                className="min-h-[38px] bg-[#c8102e] px-4 text-[12.5px] font-semibold text-white disabled:opacity-60"
              >
                {busy ? copy.saving : copy.save}
              </button>
              <button
                type="button"
                onClick={() => setNext(false)}
                className="min-h-[38px] border border-white/15 px-4 text-[12.5px] text-[#d7dcde]"
              >
                {copy.cancel}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}