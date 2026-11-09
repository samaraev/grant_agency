import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const FIELD =
  'h-[40px] w-full border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';

const WEBHOOK_URL = 'https://grant-home-inside.base44.app/functions/commsWebhook';
const SMS_PROVIDERS = ['none', 'smsru', 'smsc', 'twilio'];
const TELEPHONY_PROVIDERS = ['none', 'zadarma', 'novofon', 'telphin', 'mango'];

const FIELDS = [
  { key: 'sms_sender', label: 'smsSender' },
  { key: 'call_first_number', label: 'callFirst' },
  { key: 'email_from_name', label: 'emailFrom' },
];

function Row({ title, note, children, badge }) {
  return (
    <div className="border-b border-white/8 py-4 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[13.5px] font-semibold text-white">{title}</div>
        {badge}
      </div>
      {note ? <p className="mt-1 text-[11.5px] text-[#8f9a9f]">{note}</p> : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function IntegrationsAdmin() {
  const c = t.admin.integrations;
  const [record, setRecord] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState('');
  const [result, setResult] = useState({});
  const [copied, setCopied] = useState(false);

  const loadStatus = () =>
    base44.functions.invoke('commsTest', { kind: 'status' })
      .then((res) => setStatus(res?.data?.status || null))
      .catch(() => setStatus(null));

  useEffect(() => {
    base44.entities.AdminSettings.list({ limit: 1 })
      .then((page) => {
        const found = page?.items?.[0] || {};
        setRecord({
          ...found,
          sms_provider: SMS_PROVIDERS.includes(found.sms_provider) ? found.sms_provider : 'none',
          telephony_provider: TELEPHONY_PROVIDERS.includes(found.telephony_provider)
            ? found.telephony_provider
            : 'none',
        });
      })
      .catch(() => setRecord({}))
      .finally(() => setLoading(false));
    loadStatus();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        sms_provider: record.sms_provider || 'none',
        telephony_provider: record.telephony_provider || 'none',
      };
      FIELDS.forEach((field) => {
        payload[field.key] = record[field.key] || '';
      });
      if (record.id) await base44.entities.AdminSettings.update(record.id, payload);
      else {
        const created = await base44.entities.AdminSettings.create(payload);
        setRecord(created);
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
      loadStatus();
    } finally {
      setSaving(false);
    }
  };

  const test = async (kind) => {
    setTesting(kind);
    setResult((prev) => ({ ...prev, [kind]: null }));
    try {
      const res = await base44.functions.invoke('commsTest', { kind });
      setResult((prev) => ({ ...prev, [kind]: res?.data || {} }));
    } catch (err) {
      setResult((prev) => ({
        ...prev,
        [kind]: { ok: false, error: err?.response?.data?.error || t.admin.common.error },
      }));
    } finally {
      setTesting('');
    }
  };

  const copyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(`${WEBHOOK_URL}?token=…`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  // WhatsApp работает как ссылка: тест открывает чат, запись делает админ в карточке обращения.
  const openWhatsappTest = () => {
    const digits = String(record?.call_first_number || '').replace(/\D/g, '');
    if (!digits) return;
    window.open(
      `https://wa.me/${digits}?text=${encodeURIComponent('Проверка связи: WhatsApp из админки ГРАНТ.')}`,
      '_blank',
      'noopener'
    );
  };

  const badge = (configured) => (
    <span
      className={cn(
        'px-2 py-1 text-[10px] uppercase tracking-[0.1em]',
        configured ? 'bg-green-500/15 text-green-300' : 'bg-white/10 text-[#9aa4a8]'
      )}
    >
      {configured ? c.configured : c.notConfigured}
    </span>
  );

  const testResult = (kind) => {
    const value = result[kind];
    if (!value) return null;
    if (value.ok) return <p className="mt-1 text-[11.5px] text-green-300">{c.testOk}</p>;
    return <p className="mt-1 text-[11.5px] text-[#c9b28c]">{value.error || c.notConfigured}</p>;
  };

  const smsConfigured = (status?.sms || []).find((item) => item.id === (record?.sms_provider || 'none'))?.configured;
  const telephonyConfigured = (status?.telephony || []).find(
    (item) => item.id === (record?.telephony_provider || 'none')
  )?.configured;

  if (loading || !record) {
    return <div className="h-40 animate-pulse border border-white/10 bg-[#263033]" />;
  }

  return (
    <div>
      <div className="eyebrow">{t.admin.marker}</div>
      <h1 className="mt-3 text-[26px] font-bold text-white">{c.title}</h1>
      <p className="mt-2 text-[13px] text-[#8f9a9f]">{c.subtitle}</p>

      <div className="mt-8 max-w-3xl border border-white/10 bg-[#263033] px-5 py-2">
        <Row title={c.emailRow} note={`${c.emailNote} ${c.emailCaveat}`} badge={badge(true)}>
          <button
            type="button"
            onClick={() => test('email')}
            disabled={testing === 'email'}
            className="min-h-[36px] border border-white/15 px-3 text-[12px] text-white disabled:opacity-50"
          >
            {testing === 'email' ? c.testing : c.test}
          </button>
          {testResult('email')}
        </Row>

        <Row title={c.smsProvider} badge={badge(Boolean(smsConfigured))}>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={record.sms_provider || 'none'}
              onChange={(event) => setRecord({ ...record, sms_provider: event.target.value })}
              aria-label={c.smsProvider}
              className={cn(FIELD, 'max-w-[220px]')}
            >
              {SMS_PROVIDERS.map((id) => (
                <option key={id} value={id} className="bg-[#1f272b]">
                  {c.providers[id]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => test('sms')}
              disabled={testing === 'sms' || !smsConfigured}
              className="min-h-[36px] border border-white/15 px-3 text-[12px] text-white disabled:opacity-50"
            >
              {testing === 'sms' ? c.testing : c.test}
            </button>
          </div>
          {testResult('sms')}
        </Row>

        <Row title={c.whatsappRow} note={c.whatsappNote} badge={badge(false)}>
          <button
            type="button"
            onClick={openWhatsappTest}
            disabled={!record.call_first_number}
            className="min-h-[36px] border border-white/15 px-3 text-[12px] text-white disabled:opacity-50"
          >
            {c.openChat}
          </button>
        </Row>

        <Row title={c.telephonyProvider} badge={badge(Boolean(telephonyConfigured))}>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={record.telephony_provider || 'none'}
              onChange={(event) => setRecord({ ...record, telephony_provider: event.target.value })}
              aria-label={c.telephonyProvider}
              className={cn(FIELD, 'max-w-[220px]')}
            >
              {TELEPHONY_PROVIDERS.map((id) => (
                <option key={id} value={id} className="bg-[#1f272b]">
                  {c.providers[id]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => test('call')}
              disabled={testing === 'call' || !telephonyConfigured}
              className="min-h-[36px] border border-white/15 px-3 text-[12px] text-white disabled:opacity-50"
            >
              {testing === 'call' ? c.testing : c.test}
            </button>
          </div>
          {testResult('call')}
        </Row>

        <Row title={c.webhook} note={c.webhookHint} badge={badge(Boolean(status?.webhook))}>
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 break-all border border-white/10 bg-[#1f272b] px-3 py-2 text-[11.5px] text-[#b0b8bc]">
              {WEBHOOK_URL}?token=…
            </code>
            <button
              type="button"
              onClick={copyWebhook}
              className="flex min-h-[36px] items-center gap-2 border border-white/15 px-3 text-[12px] text-white"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              {copied ? c.copied : c.copy}
            </button>
          </div>
        </Row>
      </div>

      <div className="mt-6 max-w-3xl border border-white/10 bg-[#263033] p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <label htmlFor={`int-${field.key}`} className="eyebrow mb-2 block">
                {c[field.label]}
              </label>
              <input
                id={`int-${field.key}`}
                value={record[field.key] || ''}
                onChange={(event) => setRecord({ ...record, [field.key]: event.target.value })}
                className={FIELD}
              />
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11.5px] text-[#6f7a7f]">{c.secretsHint}</p>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="min-h-[42px] bg-[#c8102e] px-5 text-[13px] font-semibold text-white disabled:opacity-60"
          >
            {saving ? t.admin.common.loading : c.save}
          </button>
          {saved ? <span className="text-[12px] text-[#c9b28c]">{c.saved}</span> : null}
        </div>
      </div>
    </div>
  );
}