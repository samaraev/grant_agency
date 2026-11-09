import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { CURRENCIES, commissionAmount, currencySymbol, formatMoney } from '@/lib/deal';
import { normalizeStatus } from '@/lib/leadStatus';

const FIELD =
  'h-[38px] w-full border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';

const toDateInput = (value) => (value ? String(value).slice(0, 10) : '');
const todayInput = () => new Date().toISOString().slice(0, 10);

export default function DealCard({ lead, onSaved }) {
  const f = t.admin.leads.workspace.fields;
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState('RUB');
  const [percent, setPercent] = useState('');
  const [expected, setExpected] = useState('');
  const [closed, setClosed] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [suggested, setSuggested] = useState(false);

  useEffect(() => {
    setValue(lead.deal_value ?? '');
    setCurrency(lead.deal_currency || 'RUB');
    setPercent(lead.commission_percent ?? '');
    setExpected(toDateInput(lead.expected_close_date));
    setNote(lead.commission_note || '');
    setSaved(false);

    // Сделка закрыта, а даты нет — подставляем сегодняшнюю, но не сохраняем без нажатия Save.
    const stored = toDateInput(lead.closed_at);
    const suggest = !stored && normalizeStatus(lead.status) === 'deal_closed';
    setClosed(stored || (suggest ? todayInput() : ''));
    setSuggested(suggest);
  }, [lead]);

  const amount = commissionAmount(value, percent);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await base44.entities.Lead.update(lead.id, {
        deal_value: value === '' ? null : Number(value),
        deal_currency: currency,
        commission_percent: percent === '' ? null : Number(percent),
        expected_close_date: expected || null,
        closed_at: closed || null,
        commission_note: note,
      });
      onSaved(updated);
      setSuggested(false);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-white/10 bg-[#1f272b] p-4">
      <div className="eyebrow">{t.admin.leads.workspace.groups.deal}</div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="deal-value" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
            {f.dealValue}
          </label>
          <input
            id="deal-value"
            type="number"
            min="0"
            inputMode="decimal"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="deal-currency" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
            {f.dealCurrency}
          </label>
          <select
            id="deal-currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className={FIELD}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code} className="bg-[#1f272b]">
                {code} · {currencySymbol(code)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="deal-percent" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
            {f.commissionPercent}
          </label>
          <input
            id="deal-percent"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={percent}
            onChange={(event) => setPercent(event.target.value)}
            className={FIELD}
          />
        </div>
        <div className="flex items-end">
          <p className="w-full border border-white/10 px-3 py-2 text-[12.5px] text-[#c9b28c]">
            {amount === null ? f.commissionEmpty : `${f.commission}: ${formatMoney(amount, currency)} (${percent}%)`}
          </p>
        </div>
        <div>
          <label htmlFor="deal-expected" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
            {f.expectedClose}
          </label>
          <input
            id="deal-expected"
            type="date"
            value={expected}
            onChange={(event) => setExpected(event.target.value)}
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="deal-closed" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
            {f.closedAt}
          </label>
          <input
            id="deal-closed"
            type="date"
            value={closed}
            onChange={(event) => {
              setClosed(event.target.value);
              setSuggested(false);
            }}
            className={FIELD}
          />
          {suggested ? <p className="mt-1 text-[11px] text-[#8f9a9f]">{f.closedSuggestion}</p> : null}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="deal-note" className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">
            {f.commissionNote}
          </label>
          <input
            id="deal-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className={FIELD}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
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
  );
}