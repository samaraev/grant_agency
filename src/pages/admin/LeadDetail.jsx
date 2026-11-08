import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import LeadFunnelPanel from '@/components/admin/LeadFunnelPanel';
import { base44 } from '@/api/base44Client';
import { dateLocale, t } from '@/lib/i18n';
import { STATUS_TONE, normalizeStatus, statusLabel } from '@/lib/leadStatus';
import { cn } from '@/lib/utils';

const FIELD =
  'h-[40px] w-full border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';

function Row({ label, value }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{label}</div>
      <div className="mt-1 text-[13.5px] text-white">{value}</div>
    </div>
  );
}

export default function LeadDetail({ lead, onClose, onSaved }) {
  const [agreement, setAgreement] = useState('none');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!lead) return;
    setAgreement(lead.agreement || 'none');
    setNotes(lead.admin_notes || '');
    setSaved(false);
  }, [lead]);

  const save = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const updated = await base44.entities.Lead.update(lead.id, {
        agreement,
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
                {new Date(lead.created_date).toLocaleString(dateLocale())} · {lead.source || 'direct'}
              </p>
              <span
                className={cn(
                  'mt-3 inline-block px-2 py-1 text-[10.5px] uppercase tracking-[0.1em]',
                  STATUS_TONE[normalizeStatus(lead.status)] || 'bg-white/10 text-[#9aa4a8]'
                )}
              >
                {statusLabel(lead.status, t)}
              </span>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Row label={t.admin.leads.columns.type} value={t.lead.types[lead.type] || lead.type} />
                <Row
                  label={t.admin.leads.columns.cluster}
                  value={t.admin.leads.clusters[lead.cluster] || t.admin.leads.clusters.other}
                />
                <Row
                  label={t.admin.leads.funnel.personRole}
                  value={t.admin.leads.funnel.personRoles[lead.person_role] || t.admin.leads.funnel.notChosen}
                />
                <Row
                  label={t.admin.leads.funnel.areaFlag}
                  value={t.admin.leads.funnel.areas[lead.area_flag] || t.admin.leads.funnel.areas.unknown}
                />
                <Row label={t.admin.leads.detail.timeline} value={t.lead.timelines[lead.sell_timeline] || '—'} />
                <Row
                  label={t.admin.leads.detail.contact}
                  value={t.lead.contacts[lead.preferred_contact] || lead.preferred_contact}
                />
                <div className="sm:col-span-2">
                  <Row label={t.admin.leads.columns.address} value={lead.address_text || t.admin.leads.detail.noAddress} />
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

              <LeadFunnelPanel lead={lead} onSaved={onSaved} />

              <div>
                <label htmlFor="lead-agreement" className="eyebrow mb-2 block">
                  {t.admin.leads.detail.agreement}
                </label>
                <select
                  id="lead-agreement"
                  value={agreement}
                  onChange={(event) => setAgreement(event.target.value)}
                  className={FIELD}
                >
                  {Object.entries(t.admin.leads.agreements).map(([key, label]) => (
                    <option key={key} value={key} className="bg-[#1f272b]">
                      {label}
                    </option>
                  ))}
                </select>
              </div>

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
                {saved ? <span className="text-[12px] text-[#c9b28c]">{t.admin.leads.detail.saved}</span> : null}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}