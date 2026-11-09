import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { dueLabel, isOverdue, sortTasks } from '@/lib/tasks';
import TaskDialog from '@/components/admin/tasks/TaskDialog';

export default function LeadTasksCard({ lead }) {
  const copy = t.admin.tasks;
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    base44.entities.Task.filter({ lead_id: lead.id, status: 'open' }, { sort: 'due_at', limit: 30 })
      .then((page) => setTasks(sortTasks(page?.items || [])))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [lead.id]);

  useEffect(load, [load]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const complete = async (task) => {
    await base44.entities.Task.update(task.id, { status: 'done', updated_at: new Date().toISOString() });
    load();
  };

  const assignees = [...new Set([lead.responsible, user?.email].filter(Boolean))];

  return (
    <div className="border border-white/10 bg-[#1f272b] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="eyebrow">{copy.title}</div>
        <div className="flex items-center gap-3">
          <Link to={`/admin/tasks?lead_id=${lead.id}`} className="text-[11.5px] text-[#c9b28c] hover:text-white">
            {copy.allForLead}
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-h-[30px] items-center gap-1.5 border border-white/15 px-2.5 text-[11.5px] text-white hover:border-[#c9b28c]"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            {copy.newForLead}
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {loading ? (
          <div className="h-16 animate-pulse bg-white/5" />
        ) : tasks.length ? (
          tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3 border border-white/8 px-3 py-2">
              <button
                type="button"
                onClick={() => complete(task)}
                aria-label={copy.markDone}
                className="mt-0.5 h-4 w-4 shrink-0 border border-white/25 hover:border-green-500/70"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] text-white">{task.title}</div>
                <div className="mt-0.5 text-[11.5px] text-[#8f9a9f]">
                  <span className={isOverdue(task) ? 'text-[#ff8a96]' : undefined}>{dueLabel(task.due_at)}</span>
                  {task.assignee ? ` · ${task.assignee}` : ''}
                </div>
              </div>
              <span
                className={cn(
                  'shrink-0 text-[10px] uppercase tracking-[0.1em]',
                  task.priority === 'high' ? 'text-[#ff8a96]' : 'text-[#6f7a7f]'
                )}
              >
                {copy.priorities[task.priority]}
              </span>
            </div>
          ))
        ) : (
          <p className="text-[12.5px] text-[#8f9a9f]">{copy.leadEmpty}</p>
        )}
      </div>

      <TaskDialog
        open={open}
        task={null}
        defaultLeadId={lead.id}
        leads={[lead]}
        assignees={{ options: assignees, currentUserEmail: user?.email || '' }}
        onClose={() => setOpen(false)}
        onSaved={load}
      />
    </div>
  );
}