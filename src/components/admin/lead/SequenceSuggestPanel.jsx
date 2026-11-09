import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { outsideWorkingHours } from '@/lib/mskTime';
import {
  channelTarget,
  mergeLead,
  needsConsent,
  triggerForLead,
  whatsappLink,
} from '@/lib/sequences';

const BUTTON =
  'min-h-[34px] bg-[#c8102e] px-3 text-[12px] font-semibold text-white disabled:opacity-50';

/**
 * «Предложить сообщение»: подсказка по текущему статусу обращения.
 * Отправка только вручную — один клик на канал. Авто-отправка живёт на сервере.
 */
export default function SequenceSuggestPanel({ lead, onLogged }) {
  const copy = t.admin.leads.workspace.sequence;
  const seqLabels = t.admin.sequences.keys;
  const channelLabels = t.admin.sequences.channels;

  const [settings, setSettings] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      base44.entities.SequenceSetting.filter({}, { limit: 60 }).catch(() => null),
      base44.entities.MessageTemplate.list().catch(() => []),
    ]).then(([sequencePage, templateList]) => {
      if (!alive) return;
      setSettings(sequencePage?.items || []);
      setTemplates(Array.isArray(templateList) ? templateList : []);
    });

    if (lead.status === 'contact_made') {
      base44.entities.Communication.filter(
        { lead_id: lead.id, direction: 'out', status: 'answered' },
        { sort: '-created_date', limit: 1 }
      )
        .then((page) => {
          const last = page?.items?.[0];
          if (!alive) return;
          setAnswered(Boolean(last) && Date.now() - new Date(last.created_date).getTime() < 24 * 60 * 60 * 1000);
        })
        .catch(() => null);
    }

    if (lead.status === 'qualified_conversation') {
      base44.entities.OwnerAnalysis.filter({ lead_id: lead.id }, { limit: 5 })
        .then((page) => {
          if (!alive) return;
          setHasAnalysis(
            (page?.items || []).some(
              (item) =>
                String(item.recommended_strategy || '').trim() ||
                String(item.price_range_note || '').trim()
            )
          );
        })
        .catch(() => null);
    }

    return () => {
      alive = false;
    };
  }, [lead.id, lead.status]);

  const sequenceKey = triggerForLead(lead, { answeredOutbound24h: answered, hasAnalysis });

  const rows = useMemo(() => {
    if (!sequenceKey) return [];
    return settings
      .filter((item) => item.key === sequenceKey && item.is_active !== false)
      .map((item) => ({
        setting: item,
        channel: item.channel,
        template: templates.find(
          (tpl) => tpl.name === item.template_key && tpl.channel === item.channel
        ),
      }))
      .filter((row) => row.template && channelTarget(row.channel, lead));
  }, [sequenceKey, settings, templates, lead]);

  if (!sequenceKey) return null;

  const blockedByConsent = needsConsent(sequenceKey) && !lead.consent_at;

  const deliver = async (row) => {
    setPending(null);
    setBusy(row.channel);
    setError('');
    setNotice('');
    const body = mergeLead(row.template.body, lead);
    try {
      if (row.channel === 'email') {
        const response = await base44.functions.invoke('sendEmail', {
          lead_id: lead.id,
          subject: mergeLead(row.template.subject, lead),
          body,
          template_id: row.template.id,
        });
        const data = response?.data || {};
        if (data.communication) onLogged?.(data.communication);
        if (data.ok) setNotice(copy.sent);
        else setError(data.error || t.admin.common.error);
      } else if (row.channel === 'sms') {
        const response = await base44.functions.invoke('sendSms', {
          lead_id: lead.id,
          body,
          template_id: row.template.id,
          marketing: needsConsent(sequenceKey),
        });
        const data = response?.data || {};
        if (data.communication) onLogged?.(data.communication);
        if (data.ok) setNotice(copy.sent);
        else setError(data.configured === false ? copy.manualSms : data.error || t.admin.common.error);
      } else {
        window.open(whatsappLink(lead.phone, body), '_blank', 'noopener');
        setNotice(copy.manualWhatsapp);
      }
    } catch (err) {
      setError(err?.response?.data?.error || t.admin.common.error);
    } finally {
      setBusy('');
    }
  };

  const logWhatsapp = async (row) => {
    setBusy(row.channel);
    setError('');
    try {
      const record = await base44.entities.Communication.create({
        lead_id: lead.id,
        channel: 'whatsapp',
        direction: 'out',
        body: mergeLead(row.template.body, lead),
        status: 'sent',
        sequence_key: sequenceKey,
        created_by: t.admin.marker,
        sent_at: new Date().toISOString(),
      });
      onLogged?.(record);
      setNotice(copy.logged);
    } catch {
      setError(t.admin.common.error);
    } finally {
      setBusy('');
    }
  };

  const start = (row) => {
    if (outsideWorkingHours()) setPending(row);
    else deliver(row);
  };

  return (
    <div className="border border-[#c9b28c]/40 bg-[#1f272b] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="eyebrow">{copy.title}</div>
        <span className="text-[11px] text-[#8f9a9f]">{seqLabels[sequenceKey]}</span>
      </div>
      <p className="mt-2 text-[11.5px] text-[#8f9a9f]">{copy.hint}</p>

      {blockedByConsent ? (
        <p className="mt-3 border border-[#c8102e]/50 px-3 py-2 text-[12px] text-[#ff8a96]">
          {copy.noConsent}
        </p>
      ) : null}

      {rows.length ? (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={row.setting.id} className="border border-white/10 bg-[#1a2025] p-3">
              <div className="flex flex-wrap items-center gap-2 text-[10.5px] uppercase tracking-[0.1em]">
                <span className="text-[#c9b28c]">{channelLabels[row.channel]}</span>
                <span className="text-[#8f9a9f]">· {row.template.name}</span>
              </div>
              {row.template.subject ? (
                <div className="mt-1.5 text-[12.5px] font-semibold text-white">
                  {mergeLead(row.template.subject, lead)}
                </div>
              ) : null}
              <p className="mt-1 whitespace-pre-line text-[12.5px] leading-relaxed text-[#d7dcde]">
                {mergeLead(row.template.body, lead)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => start(row)}
                  disabled={Boolean(busy) || blockedByConsent}
                  className={BUTTON}
                >
                  {busy === row.channel ? copy.sending : copy.send}
                </button>
                {row.channel === 'whatsapp' ? (
                  <button
                    type="button"
                    onClick={() => logWhatsapp(row)}
                    disabled={Boolean(busy) || blockedByConsent}
                    className="min-h-[34px] border border-white/15 px-3 text-[12px] text-[#d7dcde] disabled:opacity-40"
                  >
                    {copy.logSent}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[12px] text-[#8f9a9f]">{copy.noTemplate}</p>
      )}

      {error ? <p className="mt-2 text-[12px] text-[#ff8a96]">{error}</p> : null}
      {notice ? <p className="mt-2 text-[12px] text-[#c9b28c]">{notice}</p> : null}

      <Dialog open={Boolean(pending)} onOpenChange={(next) => !next && setPending(null)}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-[440px] border-white/10 bg-[#263033] p-0">
          <div className="border-b border-white/10 px-5 py-4">
            <DialogTitle className="text-[16px] font-bold text-white">{copy.hoursTitle}</DialogTitle>
          </div>
          <div className="space-y-3 px-5 py-5">
            <p className="text-[12.5px] leading-relaxed text-[#d7dcde]">{copy.hoursText}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => pending && deliver(pending)} className={BUTTON}>
                {copy.hoursYes}
              </button>
              <button
                type="button"
                onClick={() => setPending(null)}
                className="min-h-[34px] border border-white/15 px-3 text-[12px] text-[#d7dcde]"
              >
                {copy.hoursCancel}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}