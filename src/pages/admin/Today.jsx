import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { normalizeStatus, statusLabel } from '@/lib/leadStatus';
import { formatWorked, slaList } from '@/lib/sla';
import TasksPanel from '@/components/admin/today/TasksPanel';
import { cn } from '@/lib/utils';

const CLOSED = ['non_target', 'deal_closed'];

const startOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const dayEnd = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const asDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

function Panel({ title, hint, count, children }) {
  return (
    <section className="border border-white/10 bg-[#263033] p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{title}</div>
        <div className="text-[15px] font-bold text-white">{count}</div>
      </div>
      {hint ? <p className="mt-1 text-[11.5px] text-[#6f7a7f]">{hint}</p> : null}
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function LeadRow({ lead, meta, tone }) {
  return (
    <Link
      to={`/admin/leads/${lead.id}`}
      className="flex min-h-[44px] items-center justify-between gap-3 border border-white/8 px-3 py-2 transition-colors hover:border-[#c8102e]/50"
    >
      <div className="min-w-0">
        <div className="truncate text-[13px] text-white">{lead.name || lead.phone}</div>
        <div className="truncate text-[11.5px] text-[#8f9a9f]">
          {lead.address_text || lead.phone || '—'}
        </div>
      </div>
      <div className="shrink-0 text-right">
        {meta ? <div className={cn('text-[11.5px]', tone || 'text-[#b0b8bc]')}>{meta}</div> : null}
        <div className="text-[10.5px] uppercase tracking-[0.1em] text-[#6f7a7f]">
          {statusLabel(lead.status, t)}
        </div>
      </div>
    </Link>
  );
}

export default function Today() {
  const copy = t.admin.today;
  const [leads, setLeads] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [comms, setComms] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [settings, setSettings] = useState({});
  const [user, setUser] = useState(null);
  const [scope, setScope] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Lead.list({ sort: '-created_date', limit: 400 }).catch(() => ({ items: [] })),
      base44.entities.Meeting.list({ sort: 'starts_at', limit: 200 }).catch(() => ({ items: [] })),
      base44.entities.Communication.list({ sort: '-created_date', limit: 200 }).catch(() => ({ items: [] })),
      base44.entities.AdminSettings.list({ limit: 1 }).catch(() => ({ items: [] })),
      base44.auth.me().catch(() => null),
      base44.entities.Task.filter({ status: 'open' }, { sort: 'due_at', limit: 200 }).catch(() => ({ items: [] })),
    ])
      .then(([leadPage, meetingPage, commsPage, settingsPage, me, taskPage]) => {
        setLeads(leadPage?.items || []);
        setMeetings(meetingPage?.items || []);
        setComms(commsPage?.items || []);
        setSettings(settingsPage?.items?.[0] || {});
        setUser(me);
        setTasks(taskPage?.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const data = useMemo(() => {
    const from = startOfDay();
    const to = dayEnd();

    let scoped = leads;
    if (scope === 'mine' && user?.email) {
      scoped = leads.filter((lead) => lead.responsible === user.email);
    } else if (scope === 'backup' && settings.backup_responsible) {
      scoped = leads.filter((lead) => lead.responsible === settings.backup_responsible);
    }

    const open = scoped.filter((lead) => !CLOSED.includes(normalizeStatus(lead.status)));

    const newInquiries = open.filter((lead) => {
      const created = asDate(lead.created_date);
      return normalizeStatus(lead.status) === 'new_inquiry' && created && created >= new Date(Date.now() - 14 * 86400000);
    });

    const nextActions = open.filter((lead) => {
      const due = asDate(lead.next_action_date);
      return due && due <= to;
    });

    const noNext = open.filter((lead) => !asDate(lead.next_action_date));

    const todaysMeetings = meetings.filter((meeting) => {
      const starts = asDate(meeting.starts_at);
      return starts && starts >= from && starts <= to;
    });

    const todaysCalls = comms.filter((item) => {
      const created = asDate(item.created_date);
      return item.channel === 'call' && created && created >= from && created <= to;
    });

    return {
      sla: slaList(open, settings),
      newInquiries,
      nextActions,
      noNext,
      todaysMeetings,
      todaysCalls,
    };
  }, [leads, meetings, comms, settings, scope, user]);

  const leadName = (id) => leads.find((lead) => lead.id === id)?.name || '—';
  const slaMinutes = Number(settings.first_response_sla_minutes) || 30;
  const slaHint = copy.slaHint
    .replace('{minutes}', slaMinutes)
    .replace('{start}', settings.working_hours_start || '10:00')
    .replace('{end}', settings.working_hours_end || '20:00');

  const scopes = [
    { key: 'all', label: copy.all },
    { key: 'mine', label: copy.mine },
    { key: 'backup', label: copy.backup },
  ];

  return (
    <div>
      <div className="eyebrow">{t.admin.marker}</div>
      <h1 className="mt-3 text-[26px] font-bold text-white">{copy.title}</h1>
      <p className="mt-2 max-w-[620px] text-[13px] text-[#8f9a9f]">{copy.subtitle}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {scopes.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setScope(item.key)}
            className={cn(
              'min-h-[34px] px-3 text-[12px] transition-colors',
              scope === item.key
                ? 'bg-[#c8102e] text-white'
                : 'border border-white/12 text-[#b0b8bc] hover:text-white'
            )}
          >
            {item.label}
          </button>
        ))}
        <span className="flex min-h-[34px] items-center text-[11.5px] text-[#6f7a7f]">
          {settings.backup_responsible ? copy.backupHint.replace('{email}', settings.backup_responsible) : copy.noBackup}
        </span>
      </div>

      {loading ? (
        <div className="mt-8 h-32 animate-pulse border border-white/10 bg-[#263033]" />
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <Panel title={copy.slaTitle} hint={slaHint} count={data.sla.length}>
              {data.sla.length ? (
                data.sla.slice(0, 8).map((row) => (
                  <LeadRow
                    key={row.lead.id}
                    lead={row.lead}
                    meta={`${copy.slaWorked}: ${formatWorked(row.worked)}`}
                    tone="text-[#ff8a96]"
                  />
                ))
              ) : (
                <p className="text-[12.5px] text-[#8f9a9f]">{copy.empty}</p>
              )}
            </Panel>
          </div>

          <Panel title={copy.newTitle} count={data.newInquiries.length}>
            {data.newInquiries.length ? (
              data.newInquiries.slice(0, 8).map((lead) => <LeadRow key={lead.id} lead={lead} />)
            ) : (
              <p className="text-[12.5px] text-[#8f9a9f]">{copy.empty}</p>
            )}
          </Panel>

          <Panel title={copy.meetingsTitle} count={data.todaysMeetings.length}>
            {data.todaysMeetings.length ? (
              data.todaysMeetings.map((meeting) => (
                <Link
                  key={meeting.id}
                  to={`/admin/leads/${meeting.lead_id}`}
                  className="flex min-h-[44px] items-center justify-between gap-3 border border-white/8 px-3 py-2 hover:border-[#c8102e]/50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13px] text-white">{leadName(meeting.lead_id)}</div>
                    <div className="truncate text-[11.5px] text-[#8f9a9f]">{meeting.address || '—'}</div>
                  </div>
                  <div className="shrink-0 text-[12px] text-[#c9b28c]">
                    {asDate(meeting.starts_at)?.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-[12.5px] text-[#8f9a9f]">{copy.empty}</p>
            )}
          </Panel>

          <Panel title={copy.callsTitle} count={data.todaysCalls.length}>
            {data.todaysCalls.length ? (
              data.todaysCalls.map((call) => (
                <Link
                  key={call.id}
                  to={`/admin/leads/${call.lead_id}`}
                  className="flex min-h-[44px] items-center justify-between gap-3 border border-white/8 px-3 py-2 hover:border-[#c8102e]/50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13px] text-white">{leadName(call.lead_id)}</div>
                    <div className="truncate text-[11.5px] text-[#8f9a9f]">{call.body || '—'}</div>
                  </div>
                  <div className="shrink-0 text-[12px] text-[#8f9a9f]">
                    {asDate(call.created_date)?.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-[12.5px] text-[#8f9a9f]">{copy.empty}</p>
            )}
          </Panel>

          <Panel title={copy.nextTitle} count={data.nextActions.length}>
            {data.nextActions.length ? (
              data.nextActions.slice(0, 10).map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  meta={lead.next_action_note || asDate(lead.next_action_date)?.toLocaleDateString('ru-RU')}
                  tone="text-[#c9b28c]"
                />
              ))
            ) : (
              <p className="text-[12.5px] text-[#8f9a9f]">{copy.empty}</p>
            )}
          </Panel>

          <TasksPanel tasks={tasks} leadById={Object.fromEntries(leads.map((lead) => [lead.id, lead]))} />

          <Panel title={copy.noNextTitle} hint={copy.noNextHint} count={data.noNext.length}>
            {data.noNext.length ? (
              data.noNext.slice(0, 8).map((lead) => <LeadRow key={lead.id} lead={lead} />)
            ) : (
              <p className="text-[12.5px] text-[#8f9a9f]">{copy.empty}</p>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}