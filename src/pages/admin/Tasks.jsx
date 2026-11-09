import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell, Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { TASK_PRIORITIES, TASK_STATUSES, isOverdue, sortTasks } from '@/lib/tasks';
import TasksTable from '@/components/admin/tasks/TasksTable';
import TaskDialog from '@/components/admin/tasks/TaskDialog';

export default function Tasks() {
  const copy = t.admin.tasks;
  const [params, setParams] = useSearchParams();
  const leadFilter = params.get('lead_id') || '';

  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState('open');
  const [priority, setPriority] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selected, setSelected] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      base44.entities.Task.list({ sort: 'due_at', limit: 300 }).catch(() => ({ items: [] })),
      base44.entities.Lead.list({ sort: '-created_date', limit: 300 }).catch(() => ({ items: [] })),
      base44.auth.me().catch(() => null),
    ])
      .then(([taskPage, leadPage, me]) => {
        setTasks(taskPage?.items || []);
        setLeads(leadPage?.items || []);
        setUser(me);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const leadById = useMemo(
    () => Object.fromEntries(leads.map((lead) => [lead.id, lead])),
    [leads]
  );

  const assigneeOptions = useMemo(() => {
    const values = leads.map((lead) => (lead.responsible || '').trim()).filter(Boolean);
    if (user?.email) values.push(user.email);
    return [...new Set(values)].sort();
  }, [leads, user]);

  const filtered = useMemo(() => {
    const list = tasks.filter((task) => {
      if (leadFilter && task.lead_id !== leadFilter) return false;
      if (assignee && (task.assignee || '') !== assignee) return false;
      if (status && task.status !== status) return false;
      if (priority && task.priority !== priority) return false;
      if (overdueOnly && !isOverdue(task)) return false;
      return true;
    });
    return sortTasks(list);
  }, [tasks, leadFilter, assignee, status, priority, overdueOnly]);

  const toggleSelected = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const patchTasks = async (ids, changes) => {
    if (!ids.length) return;
    const stamp = new Date().toISOString();
    await base44.entities.Task.bulkUpdate(ids.map((id) => ({ id, ...changes, updated_at: stamp })));
    setSelected([]);
    load();
  };

  const removeTask = async (task) => {
    if (!window.confirm(copy.deleteConfirm)) return;
    await base44.entities.Task.delete(task.id);
    load();
  };

  const sendReminders = async () => {
    setSending(true);
    setNotice('');
    try {
      const res = await base44.functions.invoke('sendTaskReminders', {});
      const data = res?.data || {};
      setNotice(
        `${copy.remindersSent}: ${data.sent || 0} · ${copy.remindersSkipped}: ${data.skipped || 0}`
      );
      load();
    } finally {
      setSending(false);
    }
  };

  const clearLeadFilter = () => {
    params.delete('lead_id');
    setParams(params);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">{t.admin.marker}</div>
          <h1 className="mt-3 text-[26px] font-bold text-white">{copy.title}</h1>
          <p className="mt-2 max-w-[560px] text-[13px] text-[#8f9a9f]">{copy.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={sendReminders}
            disabled={sending}
            className="flex min-h-[40px] items-center gap-2 border border-white/15 px-4 text-[12.5px] text-white hover:border-[#c9b28c] disabled:opacity-60"
          >
            <Bell className="h-3.5 w-3.5" aria-hidden="true" />
            {sending ? t.admin.common.loading : copy.reminders}
          </button>
          <button
            type="button"
            onClick={() => setDialog({ task: null, leadId: leadFilter })}
            className="flex min-h-[40px] items-center gap-2 bg-[#c8102e] px-4 text-[12.5px] font-semibold text-white"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {copy.create}
          </button>
        </div>
      </div>

      {notice ? <p className="mt-3 border border-[#c9b28c]/40 px-3 py-2 text-[12.5px] text-[#c9b28c]">{notice}</p> : null}

      {leadFilter ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 border border-white/10 bg-[#1f272b] px-3 py-2 text-[12.5px] text-[#b0b8bc]">
          <span>
            {copy.leadFilter}: {leadById[leadFilter]?.name || leadFilter}
          </span>
          <button
            type="button"
            onClick={clearLeadFilter}
            className="ml-auto flex items-center gap-1 text-[11.5px] text-[#c9b28c] hover:text-white"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            {copy.showAll}
          </button>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select
          value={assignee}
          onChange={(event) => setAssignee(event.target.value)}
          aria-label={copy.assignee}
          className="h-[40px] border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none"
        >
          <option value="">{copy.allAssignees}</option>
          {assigneeOptions.map((email) => (
            <option key={email} value={email}>
              {email}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label={copy.statusField}
          className="h-[40px] border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none"
        >
          <option value="">{copy.allStatuses}</option>
          {TASK_STATUSES.map((key) => (
            <option key={key} value={key}>
              {copy.statuses[key]}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          aria-label={copy.priority}
          className="h-[40px] border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none"
        >
          <option value="">{copy.allPriorities}</option>
          {TASK_PRIORITIES.map((key) => (
            <option key={key} value={key}>
              {copy.priorities[key]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setOverdueOnly((value) => !value)}
          aria-pressed={overdueOnly}
          className={cn(
            'min-h-[40px] px-3 text-[12.5px]',
            overdueOnly ? 'bg-[#c8102e] text-white' : 'border border-white/12 text-[#b0b8bc] hover:text-white'
          )}
        >
          {copy.onlyOverdue}
        </button>
      </div>

      {selected.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 border border-white/10 bg-[#1f272b] px-3 py-2">
          <span className="text-[12px] text-[#8f9a9f]">
            {copy.selected}: {selected.length}
          </span>
          <button
            type="button"
            onClick={() => patchTasks(selected, { status: 'done' })}
            className="min-h-[32px] bg-[#c8102e] px-3 text-[11.5px] font-semibold text-white"
          >
            {copy.bulkDone}
          </button>
          <button
            type="button"
            onClick={() => patchTasks(selected, { status: 'cancelled' })}
            className="min-h-[32px] border border-white/15 px-3 text-[11.5px] text-[#b0b8bc] hover:text-white"
          >
            {copy.bulkCancel}
          </button>
          <button
            type="button"
            onClick={() => setSelected([])}
            className="ml-auto text-[11.5px] text-[#8f9a9f] hover:text-white"
          >
            {copy.clearSelection}
          </button>
        </div>
      ) : null}

      <div className="mt-4">
        {loading ? (
          <div className="h-40 animate-pulse border border-white/10 bg-[#263033]" />
        ) : filtered.length ? (
          <TasksTable
            tasks={filtered}
            leadById={leadById}
            selected={selected}
            onToggle={toggleSelected}
            onDone={(task) => patchTasks([task.id], { status: 'done' })}
            onEdit={(task) => setDialog({ task, leadId: task.lead_id || '' })}
            onDelete={removeTask}
          />
        ) : (
          <p className="border border-white/10 bg-[#263033] px-4 py-10 text-center text-[13px] text-[#8f9a9f]">
            {copy.empty}
          </p>
        )}
      </div>

      <TaskDialog
        open={Boolean(dialog)}
        task={dialog?.task || null}
        defaultLeadId={dialog?.leadId || ''}
        leads={leads}
        assignees={{ options: assigneeOptions, currentUserEmail: user?.email || '' }}
        onClose={() => setDialog(null)}
        onSaved={load}
      />
    </div>
  );
}