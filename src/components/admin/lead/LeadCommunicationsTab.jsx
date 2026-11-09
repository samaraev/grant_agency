import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { dateLocale, t } from '@/lib/i18n';
import { outsideWorkingHours } from '@/lib/mskTime';
import CommsQuickActions from '@/components/admin/lead/CommsQuickActions';
import SequenceSuggestPanel from '@/components/admin/lead/SequenceSuggestPanel';

const CHANNEL_LABEL_KEYS = ['email', 'sms', 'call', 'telegram', 'whatsapp', 'max', 'note'];

export default function LeadCommunicationsTab({ lead, onLeadChange, onMeetings }) {
  const copy = t.admin.leads.workspace.communications;
  const comms = t.admin.leads.workspace.comms;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    base44.entities.Communication.filter({ lead_id: lead.id }, { sort: '-created_date', limit: 100 })
      .then((page) => setItems(page?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [lead.id]);

  useEffect(load, [load]);

  const onLogged = (record) => {
    if (record) setItems((prev) => [record, ...prev.filter((item) => item.id !== record.id)]);
    if (record?.direction === 'out' && !lead.first_response_at) setOffer(true);
  };

  const acceptContactMade = async () => {
    setBusy(true);
    try {
      await base44.functions.invoke('changeLeadStatus', {
        lead_id: lead.id,
        status: 'contact_made',
        payload: {},
        note: 'Первый исходящий контакт',
      });
      const updated = await base44.entities.Lead.update(lead.id, {
        first_response_at: new Date().toISOString(),
      });
      onLeadChange?.(updated);
      setOffer(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border border-white/10 bg-[#1f272b] p-4">
        <div className="eyebrow">{t.admin.leads.workspace.tabs.communications}</div>
        <div className="mt-3">
          <CommsQuickActions
            lead={lead}
            onLogged={onLogged}
            onLeadChange={onLeadChange}
            onMeetings={onMeetings}
          />
        </div>
        {outsideWorkingHours() ? (
          <p className="mt-3 text-[11.5px] text-[#c9b28c]">{comms.mskWarning}</p>
        ) : null}
      </div>

      <SequenceSuggestPanel lead={lead} onLogged={onLogged} />

      {offer ? (
        <div className="border border-[#c9b28c]/50 bg-[#1f272b] px-4 py-3">
          <p className="text-[12.5px] text-white">{comms.contactMade}</p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={acceptContactMade}
              disabled={busy}
              className="min-h-[34px] bg-[#c8102e] px-3 text-[12px] font-semibold text-white disabled:opacity-60"
            >
              {comms.contactMadeYes}
            </button>
            <button
              type="button"
              onClick={() => setOffer(false)}
              className="min-h-[34px] border border-white/15 px-3 text-[12px] text-[#d7dcde]"
            >
              {comms.contactMadeLater}
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="text-[13px] text-[#8f9a9f]">{t.admin.common.loading}</p>
      ) : items.length ? (
        <ol className="space-y-2 border-l border-white/10 pl-4">
          {items.map((item) => (
            <li key={item.id} className="relative border border-white/10 bg-[#1a2025] p-3.5">
              <span
                className="absolute -left-[22px] top-4 h-2 w-2 rounded-full bg-[#c8102e]"
                aria-hidden="true"
              />
              <div className="flex flex-wrap items-center gap-2 text-[10.5px] uppercase tracking-[0.1em] text-[#8f9a9f]">
                <span className="text-[#c9b28c]">
                  {CHANNEL_LABEL_KEYS.includes(item.channel)
                    ? copy.channels[item.channel]
                    : item.channel}
                </span>
                <span>{copy.directions[item.direction] || item.direction}</span>
                <span>· {copy.statuses[item.status] || item.status}</span>
                {item.duration_seconds ? (
                  <span>· {item.duration_seconds} {copy.seconds}</span>
                ) : null}
                <span className="ml-auto text-[#6f7a7f]">
                  {new Date(item.created_date).toLocaleString(dateLocale())}
                </span>
              </div>
              {item.subject ? <div className="mt-2 text-[13px] font-semibold text-white">{item.subject}</div> : null}
              {item.body ? (
                <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-[#d7dcde]">{item.body}</p>
              ) : null}
              {item.recording_url ? (
                <a
                  href={item.recording_url}
                  target="_blank"
                  rel="noreferrer"
                  className="link-underline mt-2 inline-block text-[12px] text-[#c9b28c]"
                >
                  {copy.recording}
                </a>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[13px] text-[#8f9a9f]">{copy.empty}</p>
      )}
    </div>
  );
}