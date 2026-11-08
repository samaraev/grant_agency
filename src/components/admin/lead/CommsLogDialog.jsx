import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';

const FIELD =
  'h-[38px] w-full border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';

/** Ручная запись звонка или сообщения в историю коммуникаций. */
export default function CommsLogDialog({ open, channel, withDuration, lead, existing, onClose, onSaved }) {
  const copy = t.admin.leads.workspace.comms;
  const [duration, setDuration] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDuration('');
    setText('');
  }, [open, channel]);

  if (!open) return null;

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        body: text,
        status: withDuration ? 'answered' : 'sent',
        duration_seconds: withDuration ? Number(duration) || 0 : 0,
      };
      const record = existing
        ? await base44.entities.Communication.update(existing.id, payload)
        : await base44.entities.Communication.create({
            lead_id: lead.id,
            channel,
            direction: 'out',
            ...payload,
          });
      onSaved?.(record);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-[480px] overflow-y-auto border-white/10 bg-[#263033] p-0">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="eyebrow">{withDuration ? copy.callTitle : copy.messageTitle}</div>
          <DialogTitle className="mt-2 text-[17px] font-bold text-white">
            {lead.name} · {lead.phone}
          </DialogTitle>
        </div>
        <div className="space-y-3 px-5 py-5">
          {withDuration ? (
            <div>
              <label htmlFor="comms-duration" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                {copy.duration}
              </label>
              <input
                id="comms-duration"
                type="number"
                min="0"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                className={FIELD}
              />
            </div>
          ) : null}
          <div>
            <label htmlFor="comms-result" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
              {withDuration ? copy.result : copy.text}
            </label>
            <textarea
              id="comms-result"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={4}
              className="w-full resize-none border border-white/10 bg-[#1f272b] p-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="min-h-[38px] bg-[#c8102e] px-4 text-[12.5px] font-semibold text-white disabled:opacity-60"
            >
              {saving ? copy.saving : copy.log}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] border border-white/15 px-4 text-[12.5px] text-[#d7dcde]"
            >
              {copy.cancel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}