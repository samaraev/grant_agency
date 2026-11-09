import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { SEQUENCE_CHANNELS, SEQUENCE_KEYS } from '@/lib/sequences';

const FIELD =
  'h-[34px] w-[72px] border border-white/10 bg-[#1f272b] px-2 text-[12.5px] text-white focus:border-[#c8102e] focus:outline-none';

const order = (row) => {
  const byKey = SEQUENCE_KEYS.indexOf(row.key);
  const byChannel = SEQUENCE_CHANNELS.indexOf(row.channel);
  return (byKey < 0 ? 99 : byKey) * 10 + (byChannel < 0 ? 9 : byChannel);
};

function Switch({ on, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={cn(
        'h-[26px] w-[46px] border transition-colors disabled:opacity-40',
        on ? 'border-[#c8102e] bg-[#c8102e]' : 'border-white/15 bg-[#1f272b]'
      )}
    >
      <span
        className={cn(
          'block h-[20px] w-[20px] bg-white transition-transform',
          on ? 'translate-x-[22px]' : 'translate-x-[2px]'
        )}
      />
    </button>
  );
}

/** Настройки сценариев: авто-отправка, задержка, включение по каналу. */
export default function Sequences() {
  const c = t.admin.sequences;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [dispatch, setDispatch] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [sent, setSent] = useState({ email: 0, sms: 0, whatsapp: 0 });

  useEffect(() => {
    base44.entities.SequenceSetting.filter({}, { limit: 60 })
      .then((page) => setRows([...(page?.items || [])].sort((a, b) => order(a) - order(b))))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    base44.entities.Communication.aggregate({
      query: { direction: 'out', created_date: { $gte: weekAgo } },
      groupBy: 'channel',
    })
      .then((res) => {
        const next = { email: 0, sms: 0, whatsapp: 0 };
        (res?.rows || []).forEach((row) => {
          if (row.channel in next) next[row.channel] = row.count || 0;
        });
        setSent(next);
      })
      .catch(() => null);
  }, []);

  const patch = async (row, changes) => {
    setSavingId(row.id);
    try {
      const updated = await base44.entities.SequenceSetting.update(row.id, changes);
      setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, ...(updated || changes) } : item)));
    } finally {
      setSavingId('');
    }
  };

  const runDispatch = async () => {
    setDispatching(true);
    setDispatch(null);
    try {
      const response = await base44.functions.invoke('dispatchSequences', {});
      setDispatch(response?.data || {});
    } catch (err) {
      setDispatch({ error: err?.response?.data?.error || t.admin.common.error });
    } finally {
      setDispatching(false);
    }
  };

  const autoCount = rows.filter((row) => row.auto_send === true).length;

  return (
    <div>
      <div className="eyebrow">{t.admin.marker}</div>
      <h1 className="mt-3 text-[26px] font-bold text-white">{c.title}</h1>
      <p className="mt-2 max-w-2xl text-[13px] text-[#8f9a9f]">{c.subtitle}</p>

      <div className="mt-5 max-w-3xl border border-[#c9b28c]/40 bg-[#1f272b] px-4 py-3">
        <p className="text-[12.5px] text-white">
          {c.summary
            .replace('{auto}', String(autoCount))
            .replace('{email}', String(sent.email))
            .replace('{sms}', String(sent.sms))
            .replace('{whatsapp}', String(sent.whatsapp))}
        </p>
        <p className="mt-2 text-[11.5px] leading-relaxed text-[#8f9a9f]">{c.caveat}</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-[#6f7a7f]">{c.autoHint}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runDispatch}
          disabled={dispatching}
          className="min-h-[38px] bg-[#c8102e] px-4 text-[12.5px] font-semibold text-white disabled:opacity-60"
        >
          {dispatching ? c.dispatching : c.dispatch}
        </button>
        {dispatch && !dispatch.error ? (
          <span className="text-[12px] text-[#c9b28c]">
            {c.dispatched
              .replace('{sent}', String(dispatch.sent || 0))
              .replace('{failed}', String(dispatch.failed || 0))
              .replace('{manual}', String(dispatch.manual || 0))}
          </span>
        ) : null}
        {dispatch?.error ? <span className="text-[12px] text-[#ff8a96]">{dispatch.error}</span> : null}
      </div>

      <div className="mt-6 overflow-x-auto border border-white/10 bg-[#263033]">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-white/10 text-[10.5px] uppercase tracking-[0.14em] text-[#778287]">
              <th className="px-4 py-3 font-medium">{c.columns.key}</th>
              <th className="px-3 py-3 font-medium">{c.columns.channel}</th>
              <th className="px-3 py-3 font-medium">{c.columns.template}</th>
              <th className="px-3 py-3 font-medium">{c.columns.auto}</th>
              <th className="px-3 py-3 font-medium">{c.columns.delay}</th>
              <th className="px-3 py-3 font-medium">{c.columns.active}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-[13px] text-[#8f9a9f]">
                  {t.admin.common.loading}
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-white/8 last:border-b-0">
                  <td className="px-4 py-3 text-[13px] text-white">{c.keys[row.key] || row.key}</td>
                  <td className="px-3 py-3 text-[12.5px] text-[#c9b28c]">{c.channels[row.channel] || row.channel}</td>
                  <td className="px-3 py-3 text-[12.5px] text-[#d7dcde]">
                    {row.template_key || <span className="text-[#ff8a96]">{c.noTemplate}</span>}
                  </td>
                  <td className="px-3 py-3">
                    <Switch
                      on={row.auto_send === true}
                      disabled={savingId === row.id}
                      onClick={() => patch(row, { auto_send: !(row.auto_send === true) })}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min="0"
                      max="168"
                      value={row.delay_hours ?? 0}
                      onChange={(event) => {
                        const value = Math.max(0, Math.min(168, Number(event.target.value) || 0));
                        setRows((prev) =>
                          prev.map((item) => (item.id === row.id ? { ...item, delay_hours: value } : item))
                        );
                      }}
                      onBlur={(event) => patch(row, { delay_hours: Math.max(0, Number(event.target.value) || 0) })}
                      aria-label={`${c.columns.delay} ${c.keys[row.key] || row.key}`}
                      className={FIELD}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Switch
                      on={row.is_active !== false}
                      disabled={savingId === row.id}
                      onClick={() => patch(row, { is_active: row.is_active === false })}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-[13px] text-[#8f9a9f]">
                  {c.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}