import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { t, dateLocale } from '@/lib/i18n';
import { reachedQualified } from '@/lib/leadStatus';
import { cn } from '@/lib/utils';

const FIELDS = ['done_text', 'implemented_text', 'checked_text', 'data_text', 'blocked_text', 'next_text'];

const startOfWeek = (date) => {
  const result = new Date(date);
  const shift = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - shift);
  result.setHours(0, 0, 0, 0);
  return result;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

function periodRange(type, anchor) {
  if (type === 'month') {
    const start = startOfMonth(anchor);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
  const start = startOfWeek(anchor);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

const inRange = (value, range) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) && date >= range.start && date <= range.end;
};

export default function Reports() {
  const copy = t.admin.reports;
  const [type, setType] = useState('week');
  const [anchor, setAnchor] = useState(() => new Date());
  const [leads, setLeads] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [reports, setReports] = useState([]);
  const [draft, setDraft] = useState({});
  const [savedId, setSavedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => periodRange(type, anchor), [type, anchor]);

  useEffect(() => {
    Promise.all([
      base44.entities.Lead.list({ sort: '-created_date', limit: 500 }).catch(() => ({ items: [] })),
      base44.entities.Meeting.list({ sort: '-starts_at', limit: 300 }).catch(() => ({ items: [] })),
      base44.entities.Report.list({ sort: '-period_start', limit: 50 }).catch(() => ({ items: [] })),
    ])
      .then(([leadPage, meetingPage, reportPage]) => {
        setLeads(leadPage?.items || []);
        setMeetings(meetingPage?.items || []);
        setReports(reportPage?.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const existing = reports.find(
      (report) =>
        report.period_type === type &&
        new Date(report.period_start).toDateString() === range.start.toDateString()
    );
    setSavedId(existing?.id || null);
    setDraft(
      existing
        ? Object.fromEntries(FIELDS.map((field) => [field, existing[field] || '']))
        : Object.fromEntries(FIELDS.map((field) => [field, '']))
    );
  }, [reports, type, range.start]);

  const metrics = useMemo(() => {
    const periodLeads = leads.filter((lead) => inRange(lead.created_date, range));
    const qualified = periodLeads.filter((lead) => reachedQualified(lead.status)).length;
    const meetingsHeld = meetings.filter(
      (meeting) => meeting.status === 'held' && inRange(meeting.starts_at, range)
    ).length;
    const contracts = periodLeads.filter((lead) =>
      ['contract_signed', 'listed_or_search_started', 'deal_closed'].includes(lead.status)
    ).length;
    const deals = periodLeads.filter((lead) => lead.status === 'deal_closed').length;
    const nonTarget = periodLeads.filter((lead) => lead.status === 'non_target').length;
    const khamovniki = periodLeads.filter((lead) => lead.cluster === 'khamovniki').length;
    return {
      leads: periodLeads.length,
      qualified,
      meetingsHeld,
      contracts,
      deals,
      nonTarget,
      khamovniki,
      conversion: periodLeads.length ? Math.round((qualified / periodLeads.length) * 100) : 0,
    };
  }, [leads, meetings, range]);

  const periodLabel = `${range.start.toLocaleDateString(dateLocale())} — ${range.end.toLocaleDateString(dateLocale())}`;

  const shift = (delta) => {
    if (type === 'month') {
      setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1));
    } else {
      const next = new Date(anchor);
      next.setDate(next.getDate() + delta * 7);
      setAnchor(next);
    }
  };

  const save = async () => {
    setSaving(true);
    setNotice('');
    try {
      const user = await base44.auth.me().catch(() => null);
      const payload = {
        period_type: type,
        period_start: range.start.toISOString(),
        period_end: range.end.toISOString(),
        metrics: JSON.stringify(metrics),
        author: user?.email || '',
        ...draft,
      };
      const record = savedId
        ? await base44.entities.Report.update(savedId, payload)
        : await base44.entities.Report.create(payload);
      setSavedId(record.id);
      setReports((prev) => {
        const rest = prev.filter((item) => item.id !== record.id);
        return [record, ...rest].sort(
          (a, b) => new Date(b.period_start).getTime() - new Date(a.period_start).getTime()
        );
      });
      setNotice(copy.saved);
      return record.id;
    } finally {
      setSaving(false);
    }
  };

  const send = async () => {
    setSending('report');
    setNotice('');
    try {
      const id = savedId || (await save());
      if (!id) return;
      const response = await base44.functions.invoke('sendDigest', { mode: 'report', report_id: id });
      const data = response?.data || {};
      setNotice(data.ok ? copy.sent : data.error || t.admin.common.error);
    } finally {
      setSending('');
    }
  };

  const sendDigest = async () => {
    setSending('digest');
    setNotice('');
    try {
      const response = await base44.functions.invoke('sendDigest', { mode: 'digest' });
      const data = response?.data || {};
      setNotice(data.ok ? copy.digestSent.replace('{sent}', data.sent ?? 0) : data.error || t.admin.common.error);
    } finally {
      setSending('');
    }
  };

  const metricRows = [
    ['leads', metrics.leads],
    ['qualified', metrics.qualified],
    ['meetings', metrics.meetingsHeld],
    ['contracts', metrics.contracts],
    ['deals', metrics.deals],
    ['nonTarget', metrics.nonTarget],
    ['khamovniki', metrics.khamovniki],
    ['conversion', `${metrics.conversion}%`],
  ];

  return (
    <div>
      <div className="eyebrow">{t.admin.marker}</div>
      <h1 className="mt-3 text-[26px] font-bold text-white">{copy.title}</h1>
      <p className="mt-2 max-w-[640px] text-[13px] text-[#8f9a9f]">{copy.subtitle}</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {[
          { key: 'week', label: copy.week },
          { key: 'month', label: copy.month },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setType(item.key)}
            className={cn(
              'min-h-[34px] px-3 text-[12px]',
              type === item.key ? 'bg-[#c8102e] text-white' : 'border border-white/12 text-[#b0b8bc]'
            )}
          >
            {item.label}
          </button>
        ))}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label={copy.shiftPrev}
            className="min-h-[34px] border border-white/12 px-3 text-[12px] text-white"
          >
            ←
          </button>
          <span className="px-2 text-[12px] text-[#d7dcde]">{periodLabel}</span>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label={copy.shiftNext}
            className="min-h-[34px] border border-white/12 px-3 text-[12px] text-white"
          >
            →
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border border-white/10 bg-[#263033] px-4 py-3">
        <button
          type="button"
          onClick={sendDigest}
          disabled={sending === 'digest'}
          className="min-h-[34px] bg-[#c8102e] px-3 text-[12px] font-semibold text-white disabled:opacity-50"
        >
          {sending === 'digest' ? copy.digestSending : copy.digestNow}
        </button>
        <span className="text-[11.5px] text-[#8f9a9f]">{copy.digestHint}</span>
      </div>

      {loading ? (
        <div className="mt-6 h-40 animate-pulse border border-white/10 bg-[#263033]" />
      ) : (
        <>
          <div id="report-print" className="mt-6 border border-white/10 bg-[#263033] p-5">
            <div className="text-[15px] font-bold text-white">
              {t.brand.name} · {copy.title}
            </div>
            <div className="mt-1 text-[12px] text-[#8f9a9f]">
              {type === 'month' ? copy.month : copy.week} · {periodLabel}
            </div>

            <div className="mt-4 text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{copy.autoTitle}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {metricRows.map(([key, value]) => (
                <div key={key} className="border border-white/10 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-[#778287]">
                    {copy.metrics[key]}
                  </div>
                  <div className="mt-1 text-[18px] font-bold text-white">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{copy.textTitle}</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <div key={field}>
                  <label
                    htmlFor={`report-${field}`}
                    className="mb-1 block text-[10.5px] uppercase tracking-[0.14em] text-[#778287]"
                  >
                    {copy[field.replace('_text', '')]}
                  </label>
                  <textarea
                    id={`report-${field}`}
                    value={draft[field] || ''}
                    onChange={(event) => setDraft({ ...draft, [field]: event.target.value })}
                    rows={4}
                    className="w-full resize-none border border-white/10 bg-[#1f272b] p-2.5 text-[12.5px] leading-relaxed text-white focus:border-[#c8102e] focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="min-h-[36px] bg-[#c8102e] px-4 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                {saving ? copy.saving : copy.save}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[36px] border border-white/15 px-4 text-[12px] text-white"
              >
                {copy.print}
              </button>
              <button
                type="button"
                onClick={send}
                disabled={sending === 'report'}
                className="min-h-[36px] border border-white/15 px-4 text-[12px] text-white disabled:opacity-50"
              >
                {sending === 'report' ? copy.sending : copy.send}
              </button>
              {notice ? <span className="text-[11.5px] text-[#c9b28c]">{notice}</span> : null}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{copy.history}</div>
            {reports.length ? (
              <ul className="mt-3 divide-y divide-white/8 border border-white/10 bg-[#263033]">
                {reports.map((report) => (
                  <li key={report.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className="text-[12.5px] text-white">
                      {new Date(report.period_start).toLocaleDateString(dateLocale())} —{' '}
                      {report.period_end ? new Date(report.period_end).toLocaleDateString(dateLocale()) : ''}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.1em] text-[#c9b28c]">
                      {report.period_type === 'month' ? copy.month : copy.week}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setType(report.period_type);
                        setAnchor(new Date(report.period_start));
                      }}
                      className="ml-auto min-h-[30px] border border-white/12 px-3 text-[11.5px] text-white"
                    >
                      {copy.open}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await base44.entities.Report.delete(report.id);
                        setReports((prev) => prev.filter((item) => item.id !== report.id));
                      }}
                      className="min-h-[30px] px-2 text-[11.5px] text-[#8f9a9f]"
                    >
                      {copy.delete}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[12.5px] text-[#8f9a9f]">{copy.emptyHistory}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}