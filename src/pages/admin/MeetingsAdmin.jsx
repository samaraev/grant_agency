import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { t, dateLocale } from '@/lib/i18n';
import { downloadIcs } from '@/lib/ics';
import { cn } from '@/lib/utils';
import MeetingsCalendar from '@/components/admin/meetings/MeetingsCalendar';

export default function MeetingsAdmin() {
  const copy = t.admin.meetings;
  const [meetings, setMeetings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [view, setView] = useState('list');
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Meeting.list({ sort: 'starts_at', limit: 300 }).catch(() => ({ items: [] })),
      base44.entities.Lead.list({ sort: '-created_date', limit: 300 }).catch(() => ({ items: [] })),
    ])
      .then(([meetingPage, leadPage]) => {
        setMeetings(meetingPage?.items || []);
        setLeads(leadPage?.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const leadsById = useMemo(
    () => Object.fromEntries(leads.map((lead) => [lead.id, lead.name || lead.phone || ''])),
    [leads]
  );
  const leadsMap = useMemo(() => Object.fromEntries(leads.map((lead) => [lead.id, lead])), [leads]);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const sorted = [...meetings].sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    );
    return {
      upcoming: sorted.filter((meeting) => new Date(meeting.starts_at).getTime() >= now),
      past: sorted.filter((meeting) => new Date(meeting.starts_at).getTime() < now).reverse(),
    };
  }, [meetings]);

  const renderRow = (meeting) => (
    <li key={meeting.id} className="border border-white/10 bg-[#263033] p-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-[13px] font-semibold text-white">
          {meeting.starts_at
            ? new Date(meeting.starts_at).toLocaleString(dateLocale(), {
                day: '2-digit',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—'}
        </span>
        <span className="text-[11px] uppercase tracking-[0.1em] text-[#c9b28c]">
          {copy.types[meeting.type] || meeting.type}
        </span>
        <span className="text-[11.5px] text-[#8f9a9f]">
          {copy.statuses[meeting.status] || meeting.status}
        </span>
      </div>
      <div className="mt-1.5 text-[13px] text-[#d7dcde]">{leadsById[meeting.lead_id] || '—'}</div>
      {meeting.address || meeting.responsible ? (
        <div className="mt-1 text-[12px] text-[#8f9a9f]">
          {[meeting.address, meeting.responsible].filter(Boolean).join(' · ')}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to={`/admin/leads/${meeting.lead_id}`}
          className="flex min-h-[32px] items-center border border-white/12 px-3 text-[11.5px] text-white"
        >
          {copy.openLead}
        </Link>
        <button
          type="button"
          onClick={() => downloadIcs(meeting, leadsMap[meeting.lead_id])}
          className="min-h-[32px] border border-white/12 px-3 text-[11.5px] text-[#c9b28c]"
        >
          {copy.ics}
        </button>
      </div>
    </li>
  );

  return (
    <div>
      <div className="eyebrow">{t.admin.marker}</div>
      <h1 className="mt-3 text-[26px] font-bold text-white">{copy.title}</h1>
      <p className="mt-2 max-w-[620px] text-[13px] text-[#8f9a9f]">{copy.subtitle}</p>
      <p className="mt-1 text-[11.5px] text-[#6f7a7f]">{copy.fromLead}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {[
          { key: 'list', label: copy.list },
          { key: 'calendar', label: copy.calendar },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setView(item.key)}
            className={cn(
              'min-h-[34px] px-3 text-[12px]',
              view === item.key ? 'bg-[#c8102e] text-white' : 'border border-white/12 text-[#b0b8bc]'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 h-40 animate-pulse border border-white/10 bg-[#263033]" />
      ) : view === 'calendar' ? (
        <div className="mt-6">
          <MeetingsCalendar
            meetings={meetings}
            month={month}
            onMonthChange={setMonth}
            leadsById={leadsById}
            statusLabels={copy.statuses}
          />
        </div>
      ) : meetings.length === 0 ? (
        <p className="mt-8 text-[13px] text-[#8f9a9f]">{copy.empty}</p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{copy.upcoming}</div>
            <ul className="mt-3 space-y-3">
              {upcoming.length ? upcoming.map(renderRow) : <li className="text-[12.5px] text-[#8f9a9f]">{copy.empty}</li>}
            </ul>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{copy.past}</div>
            <ul className="mt-3 space-y-3">
              {past.length ? past.slice(0, 20).map(renderRow) : <li className="text-[12.5px] text-[#8f9a9f]">{copy.empty}</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}