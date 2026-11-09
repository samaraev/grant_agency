import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';

const GOALS = ['qualified_conversation', 'contract_signed', 'deal_closed'];

/** Ручная отправка офлайн-конверсии по ClientID обращения. */
export default function MetricaConversionCard({ lead, onSent }) {
  const c = t.admin.leads.workspace.metrica;
  const [goal, setGoal] = useState('qualified_conversation');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const sent = Array.isArray(lead.offline_conversions_sent) ? lead.offline_conversions_sent : [];

  const send = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('uploadOfflineConversion', {
        lead_id: lead.id,
        goal_key: goal,
      });
      const data = res?.data || { ok: false, reason: 'error' };
      setResult(data);
      if (data.ok) onSent?.();
    } catch (error) {
      setResult({ ok: false, reason: 'error', detail: error?.message });
    } finally {
      setSending(false);
    }
  };

  const text = () => {
    if (!result) return '';
    if (result.ok) return c.sent;
    if (result.reason === 'already_sent') return c.alreadySent;
    if (result.reason === 'no_client_id') return c.noClientId;
    if (result.reason === 'no_metrica_token') return c.noToken;
    if (result.reason === 'metrica_not_configured') return c.notConfigured;
    return result.detail || c.error;
  };

  return (
    <div className="border border-white/10 bg-[#1f272b] p-4">
      <div className="eyebrow">{c.title}</div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-[#8f9a9f]">{c.hint}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          aria-label={c.goal}
          className="h-[38px] flex-1 border border-white/10 bg-[#263033] px-2 text-[12.5px] text-white focus:border-[#c8102e] focus:outline-none"
        >
          {GOALS.map((key) => (
            <option key={key} value={key} className="bg-[#1f272b]">
              {t.admin.integrations.goalKeys[key]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className="min-h-[38px] border border-white/15 px-3 text-[12.5px] text-white disabled:opacity-50"
        >
          {sending ? c.sending : c.send}
        </button>
      </div>

      {result ? (
        <p
          className={
            result.ok ? 'mt-3 text-[12px] text-[#c9b28c]' : 'mt-3 text-[12px] text-[#ff8a96]'
          }
        >
          {text()}
        </p>
      ) : null}

      {sent.length ? (
        <p className="mt-3 text-[11px] text-[#6f7a7f]">
          {c.sentList}:{' '}
          {sent
            .map((item) => `${t.admin.integrations.goalKeys[item.goal_key] || item.goal_key}`)
            .join(' · ')}
        </p>
      ) : (
        <p className="mt-3 text-[11px] text-[#6f7a7f]">{c.notSentYet}</p>
      )}
    </div>
  );
}