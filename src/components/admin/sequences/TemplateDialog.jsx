import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';

const FIELD =
  'h-[38px] w-full border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white placeholder:text-[#6f7a7f] focus:border-[#c8102e] focus:outline-none';
const AREA =
  'min-h-[140px] w-full resize-y border border-white/10 bg-[#1f272b] px-3 py-2 text-[13px] leading-relaxed text-white placeholder:text-[#6f7a7f] focus:border-[#c8102e] focus:outline-none';
const LABEL = 'mb-1.5 block text-[10.5px] uppercase tracking-[0.14em] text-[#778287]';

const BASE_CHANNELS = ['email', 'sms', 'whatsapp'];

/** Создание и правка шаблона сообщения. Название — ключ, на который ссылается сценарий. */
export default function TemplateDialog({ open, onOpenChange, template, templates = [], used = false, onSaved }) {
  const c = t.admin.sequences.templates;
  const [channel, setChannel] = useState('email');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setChannel(template?.channel || 'email');
    setName(template?.name || '');
    setSubject(template?.subject || '');
    setBody(template?.body || '');
  }, [open, template]);

  const channels = BASE_CHANNELS.includes(channel) ? BASE_CHANNELS : [...BASE_CHANNELS, channel];

  const save = async () => {
    const nextName = name.trim();
    if (!nextName || !body.trim()) {
      setError(c.form.required);
      return;
    }
    const duplicate = templates.some(
      (item) => item.id !== template?.id && item.name === nextName && item.channel === channel
    );
    if (duplicate) {
      setError(c.form.duplicate);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        channel,
        name: nextName,
        subject: channel === 'email' ? subject.trim() : '',
        body,
      };

      if (template?.id) {
        await base44.entities.MessageTemplate.update(template.id, payload);
        // Сценарии ссылаются на шаблон по названию: при переименовании переносим ссылки.
        if (template.name !== nextName) {
          await base44.entities.SequenceSetting.updateMany(
            { template_key: template.name, channel: template.channel },
            { $set: { template_key: nextName } }
          );
        }
      } else {
        await base44.entities.MessageTemplate.create(payload);
      }

      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err?.message || c.form.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] border-white/10 bg-[#263033]">
        <DialogTitle className="text-[18px] font-bold text-white">
          {template?.id ? c.form.editTitle : c.form.createTitle}
        </DialogTitle>

        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor="template-channel">
                {c.form.channel}
              </label>
              <select
                id="template-channel"
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
                disabled={used}
                className={`${FIELD} disabled:opacity-60`}
              >
                {channels.map((item) => (
                  <option key={item} value={item}>
                    {c.channels[item] || item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="template-name">
                {c.form.name}
              </label>
              <input
                id="template-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={FIELD}
                placeholder="first_reply"
              />
            </div>
          </div>

          <p className="text-[11.5px] leading-relaxed text-[#6f7a7f]">
            {c.form.nameHint}
            {used ? ` ${c.form.channelLocked}` : ''}
          </p>

          {channel === 'email' ? (
            <div>
              <label className={LABEL} htmlFor="template-subject">
                {c.form.subject}
              </label>
              <input
                id="template-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className={FIELD}
              />
            </div>
          ) : null}

          <div>
            <label className={LABEL} htmlFor="template-body">
              {c.form.body}
            </label>
            <textarea
              id="template-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className={AREA}
            />
            <p className="mt-1.5 text-[11.5px] text-[#6f7a7f]">{c.form.bodyHint}</p>
          </div>

          {error ? <p className="text-[12px] text-[#ff8a96]">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="min-h-[38px] bg-[#c8102e] px-4 text-[12.5px] font-semibold text-white disabled:opacity-60"
            >
              {saving ? c.form.saving : c.form.save}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="min-h-[38px] border border-white/15 px-4 text-[12.5px] text-white hover:border-[#c9b28c]"
            >
              {c.form.cancel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}