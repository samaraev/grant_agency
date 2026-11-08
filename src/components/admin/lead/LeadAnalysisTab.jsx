import { useEffect, useState } from 'react';
import { Mail, Printer } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { dateLocale, t } from '@/lib/i18n';

const FIELDS = [
  { key: 'price_range_note', label: 'price' },
  { key: 'liquidity', label: 'liquidity' },
  { key: 'competitors', label: 'competitors' },
  { key: 'long_sale_reasons', label: 'longSale' },
  { key: 'market_risks', label: 'risks' },
  { key: 'objections_and_answers', label: 'objections' },
  { key: 'recommended_strategy', label: 'strategy' },
];

const EMPTY = FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {});

export default function LeadAnalysisTab({ lead }) {
  const copy = t.admin.leads.workspace.analysis;
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.OwnerAnalysis.filter({ lead_id: lead.id }, { limit: 1 })
      .then((page) => {
        const found = (page?.items || [])[0] || null;
        setRecord(found);
        if (found) {
          setForm(
            FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: found[field.key] || '' }), {})
          );
        }
      })
      .catch(() => setRecord(null))
      .finally(() => setLoading(false));
  }, [lead.id]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const payload = { ...form, lead_id: lead.id };
      const result = record
        ? await base44.entities.OwnerAnalysis.update(record.id, payload)
        : await base44.entities.OwnerAnalysis.create(payload);
      setRecord(result);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const sendByEmail = () => {
    const labels = FIELDS.filter((field) => form[field.key].trim()).map(
      (field) => `${copy[field.label]}:\n${form[field.key]}`
    );
    const header = `${lead.name}\n${lead.address_text || ''}\n${new Date().toLocaleDateString(dateLocale())}`;
    const subject = `Анализ объекта — ${lead.address_text || lead.name}`;
    window.location.href = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      `${header}\n\n${labels.join('\n\n')}`
    )}`;
  };

  if (loading) return <p className="text-[13px] text-[#8f9a9f]">{t.admin.common.loading}</p>;

  return (
    <div className="space-y-4">
      <p className="text-[12.5px] text-[#8f9a9f]">{copy.hint}</p>

      <div id="lead-print" className="border border-white/10 bg-[#1f272b] p-4">
        <div className="hidden print:block">
          <div className="text-[18px] font-semibold">{lead.name}</div>
          <div className="text-[13px]">{lead.address_text}</div>
        </div>
        <div className="space-y-3">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <label
                htmlFor={`analysis-${field.key}`}
                className="mb-1 block text-[10.5px] uppercase tracking-[0.16em] text-[#778287] print:text-[#444]"
              >
                {copy[field.label]}
              </label>
              <textarea
                id={`analysis-${field.key}`}
                value={form[field.key]}
                onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                rows={3}
                className="w-full resize-none border border-white/10 bg-[#263033] p-3 text-[13px] leading-relaxed text-white focus:border-[#c8102e] focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="min-h-[38px] bg-[#c8102e] px-4 text-[12.5px] font-semibold text-white disabled:opacity-60"
        >
          {saving ? copy.saving : copy.save}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex min-h-[38px] items-center gap-2 border border-white/15 px-4 text-[12.5px] text-white hover:border-[#c9b28c]"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden="true" />
          {copy.print}
        </button>
        <button
          type="button"
          onClick={sendByEmail}
          disabled={!lead.email}
          title={lead.email ? '' : copy.noEmail}
          className="flex min-h-[38px] items-center gap-2 border border-white/15 px-4 text-[12.5px] text-white hover:border-[#c9b28c] disabled:opacity-40"
        >
          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
          {copy.email}
        </button>
        {saved ? <span className="text-[12px] text-[#c9b28c]">{copy.saved}</span> : null}
        {!lead.email ? <span className="text-[11.5px] text-[#6f7a7f]">{copy.noEmail}</span> : null}
      </div>
    </div>
  );
}