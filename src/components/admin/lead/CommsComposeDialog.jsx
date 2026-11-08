import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { outsideWorkingHours } from '@/lib/mskTime';

const FIELD =
  'h-[38px] w-full border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';
const AREA =
  'w-full resize-none border border-white/10 bg-[#1f272b] p-3 text-[13px] leading-relaxed text-white focus:border-[#c8102e] focus:outline-none';

/** Письмо или SMS по шаблону: отправка через агентство либо ручная запись. */
export default function CommsComposeDialog({ open, channel, lead, onClose, onLogged }) {
  const copy = t.admin.leads.workspace.comms;
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templates, setTemplates] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubject('');
    setText('');
    setTemplateId('');
    setError('');
    setManual(false);
    base44.entities.MessageTemplate.filter({ channel }, { limit: 50 })
      .then((page) => setTemplates(page?.items || []))
      .catch(() => setTemplates([]));
  }, [open, channel]);

  if (!open) return null;

  const applyTemplate = (id) => {
    setTemplateId(id);
    const template = templates.find((item) => item.id === id);
    if (template) {
      if (template.subject) setSubject(template.subject);
      setText(template.body || '');
    }
  };

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    setError('');
    try {
      const response = await base44.functions.invoke(channel === 'email' ? 'sendEmail' : 'sendSms', {
        lead_id: lead.id,
        subject,
        body: text,
        template_id: templateId || undefined,
      });
      const data = response?.data || {};
      if (data.communication) onLogged?.(data.communication);
      if (!data.ok) {
        setError(data.error || t.admin.leads.transition.error);
        setManual(true);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err?.response?.data?.error || t.admin.leads.transition.error);
    } finally {
      setSending(false);
    }
  };

  const logManually = async () => {
    setSending(true);
    try {
      const record = await base44.entities.Communication.create({
        lead_id: lead.id,
        channel,
        direction: 'out',
        subject: channel === 'email' ? subject : undefined,
        body: text,
        status: 'sent',
      });
      onLogged?.(record);
      onClose();
    } finally {
      setSending(false);
    }
  };

  const openMail = () => {
    window.location.href = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    setManual(true);
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-[540px] overflow-y-auto border-white/10 bg-[#263033] p-0">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="eyebrow">{channel === 'email' ? copy.email : copy.sms}</div>
          <DialogTitle className="mt-2 text-[17px] font-bold text-white">
            {lead.name} · {channel === 'email' ? lead.email || copy.noEmail : lead.phone || copy.noPhone}
          </DialogTitle>
        </div>

        <div className="space-y-3 px-5 py-5">
          {outsideWorkingHours() ? (
            <p className="border border-[#c9b28c]/40 px-3 py-2 text-[12px] text-[#c9b28c]">{copy.mskWarning}</p>
          ) : null}

          {templates.length ? (
            <select
              value={templateId}
              onChange={(event) => applyTemplate(event.target.value)}
              aria-label={copy.template}
              className={FIELD}
            >
              <option value="">{copy.noTemplate}</option>
              {templates.map((item) => (
                <option key={item.id} value={item.id} className="bg-[#1f272b]">
                  {item.name}
                </option>
              ))}
            </select>
          ) : null}

          {channel === 'email' ? (
            <div>
              <label htmlFor="comms-subject" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                {copy.subject}
              </label>
              <input id="comms-subject" value={subject} onChange={(event) => setSubject(event.target.value)} className={FIELD} />
            </div>
          ) : null}

          <div>
            <label htmlFor="comms-text" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
              {copy.text}
            </label>
            <textarea
              id="comms-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={7}
              className={AREA}
            />
            {channel === 'sms' ? (
              <div className="mt-1 text-right text-[11px] text-[#6f7a7f]">{text.length} / 1000</div>
            ) : null}
          </div>

          {error ? <p className="text-[12px] text-[#c9b28c]">{error}</p> : null}
          {manual ? <p className="text-[11.5px] text-[#8f9a9f]">{copy.manualHint}</p> : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={send}
              disabled={sending || !text.trim() || (channel === 'email' && !lead.email)}
              className="min-h-[38px] bg-[#c8102e] px-4 text-[12.5px] font-semibold text-white disabled:opacity-50"
            >
              {sending ? copy.sending : copy.send}
            </button>
            {channel === 'email' ? (
              <button
                type="button"
                onClick={openMail}
                disabled={!lead.email}
                className="min-h-[38px] border border-white/15 px-4 text-[12.5px] text-white disabled:opacity-40"
              >
                {copy.openMail}
              </button>
            ) : null}
            <button
              type="button"
              onClick={logManually}
              disabled={sending || !text.trim()}
              className="min-h-[38px] border border-white/15 px-4 text-[12.5px] text-white disabled:opacity-40"
            >
              {copy.manualSend}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] px-3 text-[12.5px] text-[#9aa4a8]"
            >
              {copy.cancel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}