import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { STATUS_KEYS, normalizeStatus } from '@/lib/leadStatus';
import { t } from '@/lib/i18n';

const FIELD =
  'h-[38px] w-full border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';

const CHECKLIST = [
  'owner_need_confirmed',
  'object_confirmed',
  'real_intent',
  'timeframe_recorded',
  'meeting_agreed',
  'terms_fit',
];

const EMPTY_CHECKLIST = CHECKLIST.reduce((acc, key) => ({ ...acc, [key]: false }), {});

export default function LeadFunnelPanel({ lead, onSaved }) {
  const [status, setStatus] = useState('new_inquiry');
  const [personRole, setPersonRole] = useState('other');
  const [areaFlag, setAreaFlag] = useState('unknown');
  const [timeframe, setTimeframe] = useState('unknown');
  const [intent, setIntent] = useState('');
  const [checklist, setChecklist] = useState(EMPTY_CHECKLIST);
  const [overrideReason, setOverrideReason] = useState('');
  const [contractType, setContractType] = useState('agency');
  const [contractUrl, setContractUrl] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reasons, setReasons] = useState([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!lead) return;
    setStatus(normalizeStatus(lead.status));
    setPersonRole(lead.person_role || 'other');
    setAreaFlag(lead.area_flag || 'unknown');
    setTimeframe(lead.timeframe_hint || 'unknown');
    setIntent(lead.intent_rating || '');
    setContractType(lead.contract_type || 'agency');
    setContractUrl(lead.contract_url || '');
    setRejectionReason(lead.rejection_reason || '');
    setChecklist(EMPTY_CHECKLIST);
    setOverrideReason('');
    setNote('');
    setError('');
    setApplied(false);
    setSuggestions([]);
  }, [lead]);

  useEffect(() => {
    base44.entities.RejectionReason.list({ limit: 100 })
      .then((page) => setReasons((page?.items || []).filter((item) => item.is_active !== false)))
      .catch(() => setReasons([]));
  }, []);

  const apply = async () => {
    if (!lead) return;
    setSaving(true);
    setError('');
    setApplied(false);
    try {
      const payload = {
        person_role: personRole,
        area_flag: areaFlag,
        timeframe_hint: timeframe,
      };
      if (intent) payload.intent_rating = intent;
      if (overrideReason.trim()) payload.override_reason = overrideReason.trim();
      if (status === 'qualified_conversation') payload.checklist = checklist;
      if (status === 'contract_signed') {
        payload.contract_type = contractType;
        payload.contract_url = contractUrl.trim();
      }
      if (status === 'non_target') payload.rejection_reason = rejectionReason;

      const response = await base44.functions.invoke('changeLeadStatus', {
        lead_id: lead.id,
        status,
        payload,
        note,
      });
      setSuggestions(response?.data?.suggestions || []);
      onSaved?.(response.data.lead);
      setApplied(true);
    } catch (err) {
      setError(err?.response?.data?.error || t.admin.common.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-white/10 bg-[#1f272b] p-4">
      <div className="eyebrow">{t.admin.leads.funnel.title}</div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="funnel-status" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
            {t.admin.leads.detail.status}
          </label>
          <select id="funnel-status" value={status} onChange={(e) => setStatus(e.target.value)} className={FIELD}>
            {STATUS_KEYS.map((key) => (
              <option key={key} value={key} className="bg-[#1f272b]">
                {t.admin.leads.statuses[key]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="funnel-role" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
            {t.admin.leads.funnel.personRole}
          </label>
          <select id="funnel-role" value={personRole} onChange={(e) => setPersonRole(e.target.value)} className={FIELD}>
            {Object.entries(t.admin.leads.funnel.personRoles).map(([key, label]) => (
              <option key={key} value={key} className="bg-[#1f272b]">
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="funnel-area" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
            {t.admin.leads.funnel.areaFlag}
          </label>
          <select id="funnel-area" value={areaFlag} onChange={(e) => setAreaFlag(e.target.value)} className={FIELD}>
            {Object.entries(t.admin.leads.funnel.areas).map(([key, label]) => (
              <option key={key} value={key} className="bg-[#1f272b]">
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="funnel-timeframe" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
            {t.admin.leads.funnel.timeframe}
          </label>
          <select id="funnel-timeframe" value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className={FIELD}>
            {Object.entries(t.admin.leads.funnel.timeframes).map(([key, label]) => (
              <option key={key} value={key} className="bg-[#1f272b]">
                {label}
              </option>
            ))}
          </select>
        </div>
        {status === 'qualified_conversation' ? (
          <div>
            <label htmlFor="funnel-intent" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
              {t.admin.leads.funnel.intent}
            </label>
            <select id="funnel-intent" value={intent} onChange={(e) => setIntent(e.target.value)} className={FIELD}>
              <option value="">{t.admin.leads.funnel.notChosen}</option>
              {Object.entries(t.admin.leads.funnel.intents).map(([key, label]) => (
                <option key={key} value={key} className="bg-[#1f272b]">
                  {label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {status === 'target_inquiry' && areaFlag === 'outside' ? (
        <div className="mt-3">
          <label htmlFor="funnel-override" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
            {t.admin.leads.funnel.overrideReason}
          </label>
          <input
            id="funnel-override"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder={t.admin.leads.funnel.overridePlaceholder}
            className={FIELD}
          />
        </div>
      ) : null}

      {status === 'qualified_conversation' ? (
        <div className="mt-3 border border-white/10 p-3">
          <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
            {t.admin.leads.funnel.checklist}
          </div>
          <div className="mt-2 space-y-1.5">
            {CHECKLIST.map((key) => (
              <label key={key} className="flex cursor-pointer items-start gap-2 text-[12.5px] text-[#d7dcde]">
                <input
                  type="checkbox"
                  checked={Boolean(checklist[key])}
                  onChange={(e) => setChecklist({ ...checklist, [key]: e.target.checked })}
                  className="mt-0.5 h-4 w-4 accent-[#c8102e]"
                />
                {t.admin.leads.funnel.checklistItems[key]}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {status === 'contract_signed' ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="funnel-contract-type" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
              {t.admin.leads.funnel.contractType}
            </label>
            <select
              id="funnel-contract-type"
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className={FIELD}
            >
              {Object.entries(t.admin.leads.agreements)
                .filter(([key]) => key !== 'none')
                .map(([key, label]) => (
                  <option key={key} value={key} className="bg-[#1f272b]">
                    {label}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label htmlFor="funnel-contract-url" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
              {t.admin.leads.funnel.contractUrl}
            </label>
            <input
              id="funnel-contract-url"
              value={contractUrl}
              onChange={(e) => setContractUrl(e.target.value)}
              className={FIELD}
            />
          </div>
        </div>
      ) : null}

      {status === 'non_target' ? (
        <div className="mt-3">
          <label htmlFor="funnel-rejection" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
            {t.admin.leads.funnel.rejection}
          </label>
          <select
            id="funnel-rejection"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className={FIELD}
          >
            <option value="">{t.admin.leads.funnel.rejectionPlaceholder}</option>
            {reasons.map((item) => (
              <option key={item.id} value={item.label} className="bg-[#1f272b]">
                {item.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="mt-3">
        <label htmlFor="funnel-note" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
          {t.admin.leads.funnel.note}
        </label>
        <input id="funnel-note" value={note} onChange={(e) => setNote(e.target.value)} className={FIELD} />
      </div>

      {error ? <p className="mt-3 text-[12px] text-[#c9b28c]">{error}</p> : null}
      {suggestions.length ? (
        <div className="mt-3 border border-[#c9b28c]/40 px-3 py-2 text-[12px] text-[#c9b28c]">
          {t.admin.leads.funnel.suggestion}: {suggestions.map((item) => item.rejection_reason).join(', ')}
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={apply}
          disabled={saving}
          className="min-h-[38px] bg-[#c8102e] px-4 text-[12.5px] font-semibold text-white disabled:opacity-60"
        >
          {saving ? t.admin.leads.funnel.applying : t.admin.leads.funnel.apply}
        </button>
        {applied ? <span className="text-[12px] text-[#c9b28c]">{t.admin.leads.funnel.applied}</span> : null}
      </div>
    </div>
  );
}