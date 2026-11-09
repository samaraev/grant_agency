import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const FIELD =
  'h-[40px] w-full border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';
const GOAL_KEYS = [
  'lead_submit',
  'phone_click',
  'form_start',
  'qualified_conversation',
  'contract_signed',
  'deal_closed',
];

const today = () => new Date().toISOString().slice(0, 10);

/** Настройки счётчика Метрики: включение, номер, сопоставление целей. */
export default function MetricaSection() {
  const c = t.admin.integrations;
  const [record, setRecord] = useState(null);
  const [goals, setGoals] = useState({});
  const [tokenPresent, setTokenPresent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState(null);

  useEffect(() => {
    base44.entities.IntegrationSettings.list({ limit: 1 })
      .then((page) => {
        const found = page?.items?.[0] || null;
        setRecord(found);
        setGoals(found?.metrica_goal_ids && typeof found.metrica_goal_ids === 'object' ? found.metrica_goal_ids : {});
      })
      .catch(() => setRecord(null));

    base44.functions
      .invoke('fetchMetricaStats', { probe: true })
      .then((res) => setTokenPresent(res?.data?.token_present === true))
      .catch(() => setTokenPresent(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const clean = {};
      GOAL_KEYS.forEach((key) => {
        const value = Number(goals[key]);
        if (Number.isFinite(value) && value > 0) clean[key] = Math.round(value);
      });
      const payload = {
        metrica_enabled: record?.metrica_enabled === true,
        metrica_counter_id: String(record?.metrica_counter_id || '').trim(),
        metrica_goal_ids: clean,
        updated_at: new Date().toISOString(),
      };
      if (record?.id) await base44.entities.IntegrationSettings.update(record.id, payload);
      else setRecord(await base44.entities.IntegrationSettings.create(payload));
      setGoals(clean);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const runCheck = async () => {
    setChecking(true);
    setCheck(null);
    try {
      const res = await base44.functions.invoke('fetchMetricaStats', {
        date_from: today(),
        date_to: today(),
      });
      setCheck(res?.data || { ok: false, reason: 'error' });
      if (res?.data?.token_present !== undefined) setTokenPresent(res.data.token_present === true);
    } catch {
      setCheck({ ok: false, reason: 'error' });
    } finally {
      setChecking(false);
    }
  };

  const checkText = () => {
    if (!check) return '';
    if (check.ok) return c.metricaOk;
    if (check.reason === 'no_metrica_token') return c.metricaTokenOff;
    if (check.reason === 'metrica_not_configured') return c.metricaCheckEmpty;
    return check.detail || c.metricaCheckEmpty;
  };

  return (
    <div className="mt-6 max-w-3xl border border-white/10 bg-[#263033] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[13.5px] font-semibold text-white">{c.metricaTitle}</div>
        <span
          className={cn(
            'border px-2 py-[3px] text-[10.5px] uppercase tracking-[0.14em]',
            tokenPresent
              ? 'border-[#c9b28c]/50 text-[#c9b28c]'
              : 'border-white/15 text-[#8f9a9f]'
          )}
        >
          {tokenPresent ? c.metricaTokenOn : c.metricaTokenOff}
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={record?.metrica_enabled === true}
            onChange={(event) => setRecord({ ...(record || {}), metrica_enabled: event.target.checked })}
            className="h-4 w-4 accent-[#c8102e]"
          />
          <span className="text-[12.5px] text-[#d7dcde]">{c.metricaEnabled}</span>
        </label>
        <div>
          <label htmlFor="metrica-counter" className="eyebrow mb-2 block">
            {c.metricaCounter}
          </label>
          <input
            id="metrica-counter"
            value={record?.metrica_counter_id || ''}
            onChange={(event) => setRecord({ ...(record || {}), metrica_counter_id: event.target.value })}
            className={FIELD}
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="mt-5">
        <div className="eyebrow">{c.metricaGoals}</div>
        <div className="mt-3 space-y-2">
          {GOAL_KEYS.map((key) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="text-[12.5px] text-[#d7dcde]">{c.goalKeys[key]}</span>
              <input
                aria-label={c.goalKeys[key]}
                value={goals[key] ?? ''}
                onChange={(event) => setGoals({ ...goals, [key]: event.target.value })}
                className={cn(FIELD, 'max-w-[128px]')}
                inputMode="numeric"
                placeholder="ID"
              />
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-[#6f7a7f]">{c.metricaGoalHint}</p>
      </div>

      <p className="mt-4 text-[11.5px] leading-relaxed text-[#6f7a7f]">{c.metricaTokenHint}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="min-h-[42px] bg-[#c8102e] px-5 text-[13px] font-semibold text-white disabled:opacity-60"
        >
          {saving ? t.admin.common.loading : c.metricaSave}
        </button>
        <button
          type="button"
          onClick={runCheck}
          disabled={checking}
          className="min-h-[42px] border border-white/15 px-4 text-[13px] text-white disabled:opacity-50"
        >
          {checking ? c.metricaChecking : c.metricaCheck}
        </button>
        {saved ? <span className="text-[12px] text-[#c9b28c]">{c.metricaSaved}</span> : null}
        {check ? (
          <span className={check.ok ? 'text-[12px] text-[#c9b28c]' : 'text-[12px] text-[#ff8a96]'}>
            {checkText()}
          </span>
        ) : null}
      </div>
    </div>
  );
}