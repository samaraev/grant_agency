import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';

const FIELD =
  'h-[40px] w-full border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';

export default function LeadDetail({ lead, onClose, onSaved }) {
  const [status, setStatus] = useState('new');
  const [meaningful, setMeaningful] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!lead) return;
    setStatus(lead.status || 'new');
    setMeaningful(Boolean(lead.is_meaningful));
    setNotes(lead.admin_notes || '');
    setSaved(false);
  }, [lead]);

  const save = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const updated = await base44.entities.Lead.update(lead.id, {
        status,
        is_meaningful: meaningful,
        admin_notes: notes,
      });
      onSaved(updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(lead)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-[620px] overflow-y-auto border-white/10 bg-[#263033] p-0">
        {lead ? (
          <>
            <div className="border-b border-white/10 px-5 py-4">
              <div className="eyebrow">{t.admin.leads.detail.title}</div>
              <DialogTitle className="mt-2 text-[20px] font-bold text-white">
                {lead.name} · {lead.phone}
              </DialogTitle>
              <p className="mt-1 text-[12px] text-[#8f9a9f]">
                {new Date(lead.created_date).toLocaleString('ru-RU')} · {lead.source || 'direct'}
              </p>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                    {t.admin.leads.columns.type}
                  </div>
                  <div className="mt-1 text-[13.5px] text-white">{t.lead.types[lead.type] || lead.type}</div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                    {t.admin.leads.detail.contact}
                  </div>
                  <div className="mt-1 text-[13.5px] text-white">
                    {t.lead.contacts[lead.preferred_contact] || lead.preferred_contact}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                    {t.admin.leads.columns.address}
                  </div>
                  <div className="mt-1 text-[13.5px] text-white">
                    {lead.address_text || t.admin.leads.detail.noAddress}
                  </div>
                </div>
                {lead.message ? (
                  <div className="sm:col-span-2">
                    <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                      {t.admin.leads.detail.message}
                    </div>
                    <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-[#d7dcde]">
                      {lead.message}
                    </p>
                  </div>
                ) : null}
                <div className="sm:col-span-2">
                  <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                    {t.admin.leads.detail.source}
                  </div>
                  <div className="mt-1 text-[12.5px] text-[#b0b8bc]">
                    {[lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(' / ') ||
                      lead.source ||
                      'direct'}
                    {lead.referrer ? ` · ${lead.referrer}` : ''}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="lead-status" className="eyebrow mb-2 block">
                  {t.admin.leads.detail.status}
                </label>
                <select
                  id="lead-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className={FIELD}
                >
                  {Object.entries(t.admin.leads.statuses).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={meaningful}
                  onChange={(event) => setMeaningful(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#c8102e]"
                />
                <span>
                  <span className="block text-[13px] text-white">{t.admin.leads.detail.meaningful}</span>
                  <span className="mt-0.5 block text-[11.5px] text-[#8f9a9f]">
                    {t.admin.leads.detail.meaningfulHint}
                  </span>
                </span>
              </label>

              <div>
                <label htmlFor="lead-notes" className="eyebrow mb-2 block">
                  {t.admin.leads.detail.notes}
                </label>
                <textarea
                  id="lead-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  placeholder={t.admin.leads.detail.notesPlaceholder}
                  className="w-full resize-none border border-white/10 bg-[#1f272b] p-3 text-[13px] text-white placeholder:text-[#6f7a7f] focus:border-[#c8102e] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="flex min-h-[42px] items-center bg-[#c8102e] px-5 text-[13px] font-semibold text-white disabled:opacity-60"
                >
                  {saving ? t.admin.common.loading : t.admin.leads.detail.save}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex min-h-[42px] items-center border border-white/15 px-4 text-[13px] text-[#d7dcde]"
                >
                  {t.admin.leads.detail.close}
                </button>
                {saved ? <span className="text-[12px] text-[#f4a7b0]">{t.admin.leads.detail.saved}</span> : null}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}