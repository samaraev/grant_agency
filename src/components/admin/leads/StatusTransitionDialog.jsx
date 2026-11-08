import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { CHECKLIST_KEYS, statusLabel } from '@/lib/leadStatus';

const FIELD =
  'h-[38px] w-full border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';

const EMPTY_CHECKLIST = CHECKLIST_KEYS.reduce((acc, key) => ({ ...acc, [key]: false }), {});

function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
      {children}
    </label>
  );
}

/** Собирает обязательные данные перехода перед вызовом changeLeadStatus. */
export default function StatusTransitionDialog({ transition, onClose, onDone }) {
  const lead = transition?.lead || null;
  const status = transition?.status || '';
  const [checklist, setChecklist] = useState(EMPTY_CHECKLIST);
  const [intent, setIntent] = useState('');
  const [timeframe, setTimeframe] = useState('unknown');
  const [contractType, setContractType] = useState('agency');
  const [contractUrl, setContractUrl] = useState('');
  const [rejection, setRejection] = useState('');
  const [reasons, setReasons] = useState([]);
  const [role, setRole] = useState('other');
  const [override, setOverride] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!lead) return;
    setChecklist(EMPTY_CHECKLIST);
    setIntent(lead.intent_rating || '');
    setTimeframe(lead.timeframe_hint && lead.timeframe_hint !== 'unknown' ? lead.timeframe_hint : 'unknown');
    setContractType(lead.contract_type || 'agency');
    setContractUrl(lead.contract_url || '');
    setRejection(lead.rejection_reason || '');
    setRole(lead.person_role || 'other');
    setOverride('');
    setNote('');
    setError('');
  }, [lead, status]);

  useEffect(() => {
    if (status !== 'non_target') return;
    base44.entities.RejectionReason.list({ limit: 100 })
      .then((page) => setReasons((page?.items || []).filter((item) => item.is_active !== false)))
      .catch(() => setReasons([]));
  }, [status]);

  const submit = async () => {
    if (!lead) return;
    setSaving(true);
    setError('');
    const payload = {};
    if (status === 'qualified_conversation') {
      payload.checklist = checklist;
      payload.intent_rating = intent;
      payload.timeframe_hint = timeframe;
    }
    if (status === 'contract_signed') {
      payload.contract_type = contractType;
      payload.contract_url = contractUrl.trim();
    }
    if (status === 'non_target') payload.rejection_reason = rejection;
    if (status === 'target_inquiry') {
      payload.person_role = role;
      if (override.trim()) payload.override_reason = override.trim();
    }
    try {
      const res = await base44.functions.invoke('changeLeadStatus', {
        lead_id: lead.id,
        status,
        payload,
        note,
      });
      onDone?.(res?.data?.lead);
    } catch (err) {
      setError(err?.response?.data?.error || t.admin.leads.transition.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(lead)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-[520px] overflow-y-auto border-white/10 bg-[#263033] p-0">
        {lead ? (
          <>
            <div className="border-b border-white/10 px-5 py-4">
              <div className="eyebrow">{t.admin.leads.transition.title}</div>
              <DialogTitle className="mt-2 text-[18px] font-bold text-white">
                {lead.name} → {statusLabel(status, t)}
              </DialogTitle>
              <p className="mt-1 text-[12px] text-[#8f9a9f]">{lead.phone}</p>
            </div>

            <div className="space-y-3 px-5 py-5">
              {status === 'qualified_conversation' ? (
                <>
                  <div className="border border-white/10 p-3">
                    <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
                      {t.admin.leads.funnel.checklist}
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {CHECKLIST_KEYS.map((key) => (
                        <label key={key} className="flex cursor-pointer items-start gap-2 text-[12.5px] text-[#d7dcde]">
                          <input
                            type="checkbox"
                            checked={Boolean(checklist[key])}
                            onChange={(event) => setChecklist({ ...checklist, [key]: event.target.checked })}
                            className="mt-0.5 h-4 w-4 accent-[#c8102e]"
                          />
                          {t.admin.leads.funnel.checklistItems[key]}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="transition-intent">{t.admin.leads.funnel.intent}</Label>
                      <select id="transition-intent" value={intent} onChange={(e) => setIntent(e.target.value)} className={FIELD}>
                        <option value="">{t.admin.leads.funnel.notChosen}</option>
                        {Object.entries(t.admin.leads.funnel.intents).map(([key, label]) => (
                          <option key={key} value={key} className="bg-[#1f272b]">{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="transition-timeframe">{t.admin.leads.funnel.timeframe}</Label>
                      <select id="transition-timeframe" value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className={FIELD}>
                        {Object.entries(t.admin.leads.funnel.timeframes).map(([key, label]) => (
                          <option key={key} value={key} className="bg-[#1f272b]">{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              ) : null}

              {status === 'contract_signed' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="transition-contract-type">{t.admin.leads.funnel.contractType}</Label>
                    <select
                      id="transition-contract-type"
                      value={contractType}
                      onChange={(e) => setContractType(e.target.value)}
                      className={FIELD}
                    >
                      {Object.entries(t.admin.leads.agreements)
                        .filter(([key]) => key !== 'none')
                        .map(([key, label]) => (
                          <option key={key} value={key} className="bg-[#1f272b]">{label}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="transition-contract-url">{t.admin.leads.funnel.contractUrl}</Label>
                    <input
                      id="transition-contract-url"
                      value={contractUrl}
                      onChange={(e) => setContractUrl(e.target.value)}
                      className={FIELD}
                    />
                  </div>
                </div>
              ) : null}

              {status === 'non_target' ? (
                <div>
                  <Label htmlFor="transition-rejection">{t.admin.leads.funnel.rejection}</Label>
                  <select
                    id="transition-rejection"
                    value={rejection}
                    onChange={(e) => setRejection(e.target.value)}
                    className={FIELD}
                  >
                    <option value="">{t.admin.leads.funnel.rejectionPlaceholder}</option>
                    {reasons.map((item) => (
                      <option key={item.id} value={item.label} className="bg-[#1f272b]">{item.label}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              {status === 'target_inquiry' ? (
                <>
                  <div>
                    <Label htmlFor="transition-role">{t.admin.leads.funnel.personRole}</Label>
                    <select id="transition-role" value={role} onChange={(e) => setRole(e.target.value)} className={FIELD}>
                      {Object.entries(t.admin.leads.funnel.personRoles).map(([key, label]) => (
                        <option key={key} value={key} className="bg-[#1f272b]">{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="transition-override">{t.admin.leads.funnel.overrideReason}</Label>
                    <input
                      id="transition-override"
                      value={override}
                      onChange={(e) => setOverride(e.target.value)}
                      placeholder={t.admin.leads.funnel.overridePlaceholder}
                      className={FIELD}
                    />
                  </div>
                </>
              ) : null}

              <div>
                <Label htmlFor="transition-note">{t.admin.leads.transition.note}</Label>
                <input id="transition-note" value={note} onChange={(e) => setNote(e.target.value)} className={FIELD} />
              </div>

              {error ? <p className="text-[12px] text-[#c9b28c]">{error}</p> : null}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={submit}
                  disabled={saving}
                  className="min-h-[40px] bg-[#c8102e] px-5 text-[12.5px] font-semibold text-white disabled:opacity-60"
                >
                  {saving ? t.admin.leads.transition.applying : t.admin.leads.transition.apply}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[40px] border border-white/15 px-4 text-[12.5px] text-[#d7dcde]"
                >
                  {t.admin.leads.transition.cancel}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}