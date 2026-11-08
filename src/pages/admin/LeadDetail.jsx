import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { dateLocale, t } from '@/lib/i18n';
import { STATUS_TONE, normalizeStatus, statusLabel } from '@/lib/leadStatus';
import { cn } from '@/lib/utils';

function Row({ label, value }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{label}</div>
      <div className="mt-1 text-[13px] text-white">{value || '—'}</div>
    </div>
  );
}

/** Быстрый просмотр обращения: карточка живёт на отдельной странице. */
export default function LeadDetail({ lead, onClose }) {
  return (
    <Dialog open={Boolean(lead)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-[560px] overflow-y-auto border-white/10 bg-[#263033] p-0">
        {lead ? (
          <>
            <div className="border-b border-white/10 px-5 py-4">
              <div className="eyebrow">{t.admin.leads.workspace.quickPreview}</div>
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

            <div className="space-y-3 px-5 py-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Row label={t.admin.leads.columns.type} value={t.lead.types[lead.type] || lead.type} />
                <Row
                  label={t.admin.leads.funnel.personRole}
                  value={t.admin.leads.funnel.personRoles[lead.person_role] || t.admin.leads.funnel.notChosen}
                />
                <Row
                  label={t.admin.leads.funnel.areaFlag}
                  value={t.admin.leads.funnel.areas[lead.area_flag] || t.admin.leads.funnel.areas.unknown}
                />
                <Row
                  label={t.admin.leads.funnel.intent}
                  value={t.admin.leads.funnel.intents[lead.intent_rating] || t.admin.leads.funnel.notChosen}
                />
                <div className="sm:col-span-2">
                  <Row label={t.admin.leads.columns.address} value={lead.address_text || t.admin.leads.detail.noAddress} />
                </div>
                <div className="sm:col-span-2">
                  <Row label={t.admin.leads.columns.responsible} value={lead.responsible} />
                </div>
                <div className="sm:col-span-2">
                  <Row
                    label={t.admin.leads.columns.nextAction}
                    value={[lead.next_action_date, lead.next_action_note].filter(Boolean).join(' · ')}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to={`/admin/leads/${lead.id}`}
                  onClick={onClose}
                  className="flex min-h-[42px] items-center gap-2 bg-[#c8102e] px-5 text-[13px] font-semibold text-white"
                >
                  {t.admin.leads.workspace.openCard}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex min-h-[42px] items-center border border-white/15 px-4 text-[13px] text-[#d7dcde]"
                >
                  {t.admin.leads.detail.close}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}