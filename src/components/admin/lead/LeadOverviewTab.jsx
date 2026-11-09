import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { dateLocale, t } from '@/lib/i18n';
import JourneyChecklist from '@/components/admin/lead/JourneyChecklist';
import DealCard from '@/components/admin/lead/DealCard';
import LeadFunnelPanel from '@/components/admin/LeadFunnelPanel';

const FIELD =
  'h-[38px] w-full border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';
const AREA =
  'w-full resize-none border border-white/10 bg-[#1f272b] p-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';

function Row({ label, value }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{label}</div>
      <div className="mt-1 break-words text-[13px] text-white">{value ?? '—'}</div>
    </div>
  );
}

function Card({ title, children, className }) {
  return (
    <div className={`border border-white/10 bg-[#1f272b] p-4 ${className || ''}`}>
      <div className="eyebrow">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function LeadOverviewTab({ lead, onSaved }) {
  const f = t.admin.leads.workspace.fields;
  const [responsible, setResponsible] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [nextNote, setNextNote] = useState('');
  const [agreement, setAgreement] = useState('none');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setResponsible(lead.responsible || '');
    setNextDate(lead.next_action_date || '');
    setNextNote(lead.next_action_note || '');
    setAgreement(lead.agreement || 'none');
    setNotes(lead.admin_notes || '');
    setSaved(false);
  }, [lead]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await base44.entities.Lead.update(lead.id, {
        responsible,
        next_action_date: nextDate,
        next_action_note: nextNote,
        agreement,
        admin_notes: notes,
      });
      onSaved(updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const utm = [lead.utm_source, lead.utm_medium, lead.utm_campaign, lead.utm_term, lead.utm_content]
    .filter(Boolean)
    .join(' / ');

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <JourneyChecklist lead={lead} />
        <LeadFunnelPanel lead={lead} onSaved={onSaved} />
      </div>

      <DealCard lead={lead} onSaved={onSaved} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t.admin.leads.workspace.groups.contacts}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label={t.admin.leads.columns.phone} value={lead.phone} />
            <Row label={f.email} value={lead.email} />
            <Row label={f.telegram} value={lead.telegram_username} />
            <Row label={f.contact} value={t.lead.contacts[lead.preferred_contact] || lead.preferred_contact} />
          </div>
        </Card>

        <Card title={t.admin.leads.workspace.groups.funnel}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label={t.admin.leads.columns.type} value={t.lead.types[lead.type] || lead.type} />
            <Row
              label={t.admin.leads.columns.cluster}
              value={t.admin.leads.clusters[lead.cluster] || t.admin.leads.clusters.other}
            />
            <Row
              label={f.role}
              value={t.admin.leads.funnel.personRoles[lead.person_role] || t.admin.leads.funnel.notChosen}
            />
            <Row label={f.area} value={t.admin.leads.funnel.areas[lead.area_flag] || t.admin.leads.funnel.areas.unknown} />
            <Row label={f.intent} value={t.admin.leads.funnel.intents[lead.intent_rating]} />
            <Row label={f.timeframe} value={t.admin.leads.funnel.timeframes[lead.timeframe_hint]} />
            <Row label={f.sellTimeline} value={t.lead.timelines[lead.sell_timeline]} />
            <Row label={f.qualifiedAt} value={lead.qualified_at ? new Date(lead.qualified_at).toLocaleString(dateLocale()) : null} />
            <Row label={f.contractType} value={lead.contract_type ? t.admin.leads.agreements[lead.contract_type] : null} />
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{f.contractUrl}</div>
              <div className="mt-1 text-[13px]">
                {lead.contract_url ? (
                  <a href={lead.contract_url} target="_blank" rel="noreferrer" className="link-underline text-[#c9b28c]">
                    {t.admin.leads.workspace.fields.contractUrl}
                  </a>
                ) : (
                  '—'
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{f.building}</div>
              <div className="mt-1 text-[13px]">
                {lead.building_id ? (
                  <Link to={`/house/${lead.building_id}`} className="link-underline text-[#c9b28c]">
                    {t.admin.leads.workspace.fields.openBuilding}
                  </Link>
                ) : (
                  lead.address_text || '—'
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Row label={t.admin.leads.columns.address} value={lead.address_text} />
            </div>
          </div>
        </Card>

        <Card title={t.admin.leads.workspace.groups.attribution}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label={f.source} value={lead.source || 'direct'} />
            <Row label={f.utm} value={utm || null} />
            <Row label={f.clientId} value={lead.client_id} />
            <Row label={f.referrer} value={lead.referrer} />
            <Row label={f.pagePath} value={lead.page_path} />
            <Row label={f.repeat} value={lead.is_repeat ? f.yes : f.no} />
            <Row
              label={f.consent}
              value={lead.consent_at ? new Date(lead.consent_at).toLocaleString(dateLocale()) : null}
            />
            <Row label={f.consentVersion} value={lead.consent_text_version} />
            <Row
              label={f.firstResponse}
              value={lead.first_response_at ? new Date(lead.first_response_at).toLocaleString(dateLocale()) : null}
            />
            <Row label={f.tags} value={(lead.tags || []).join(', ') || null} />
            <Row label={f.created} value={new Date(lead.created_date).toLocaleString(dateLocale())} />
          </div>
        </Card>

        <Card title={t.admin.leads.workspace.groups.owner}>
          <div className="space-y-3">
            <div>
              <label htmlFor="lead-responsible" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                {f.responsible}
              </label>
              <input id="lead-responsible" value={responsible} onChange={(e) => setResponsible(e.target.value)} className={FIELD} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="lead-next-date" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                  {f.nextActionDate}
                </label>
                <input
                  id="lead-next-date"
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className={FIELD}
                />
              </div>
              <div>
                <label htmlFor="lead-agreement" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                  {f.agreement}
                </label>
                <select id="lead-agreement" value={agreement} onChange={(e) => setAgreement(e.target.value)} className={FIELD}>
                  {Object.entries(t.admin.leads.agreements).map(([key, label]) => (
                    <option key={key} value={key} className="bg-[#1f272b]">
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="lead-next-note" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                {f.nextActionNote}
              </label>
              <input id="lead-next-note" value={nextNote} onChange={(e) => setNextNote(e.target.value)} className={FIELD} />
            </div>
            <div>
              <label htmlFor="lead-notes" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                {f.notes}
              </label>
              <textarea
                id="lead-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder={t.admin.leads.detail.notesPlaceholder}
                className={AREA}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="min-h-[38px] bg-[#c8102e] px-4 text-[12.5px] font-semibold text-white disabled:opacity-60"
              >
                {saving ? t.admin.common.loading : f.save}
              </button>
              {saved ? <span className="text-[12px] text-[#c9b28c]">{f.saved}</span> : null}
            </div>
          </div>
        </Card>
      </div>

      {lead.message ? (
        <Card title={t.admin.leads.detail.message}>
          <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[#d7dcde]">{lead.message}</p>
        </Card>
      ) : null}
    </div>
  );
}