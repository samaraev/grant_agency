import { Link } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { dueLabel, isDueToday, isOverdue, sortTasks } from '@/lib/tasks';

export default function TasksPanel({ tasks, leadById }) {
  const copy = t.admin.tasks;
  const open = tasks.filter((task) => task.status === 'open');
  const items = sortTasks(open.filter((task) => isDueToday(task) || isOverdue(task)));

  return (
    <section className="border border-white/10 bg-[#263033] p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{copy.title}</div>
        <div className="text-[15px] font-bold text-white">{items.length}</div>
      </div>
      <p className="mt-1 text-[11.5px] text-[#6f7a7f]">{copy.todayHint}</p>
      <div className="mt-3 space-y-2">
        {items.length ? (
          items.slice(0, 10).map((task) => {
            const lead = leadById[task.lead_id];
            return (
              <Link
                key={task.id}
                to={task.lead_id ? `/admin/leads/${task.lead_id}` : '/admin/tasks'}
                className="flex min-h-[44px] items-center justify-between gap-3 border border-white/8 px-3 py-2 transition-colors hover:border-[#c8102e]/50"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] text-white">{task.title}</div>
                  <div className="truncate text-[11.5px] text-[#8f9a9f]">
                    {lead ? [lead.name, lead.phone].filter(Boolean).join(' · ') : task.assignee || copy.unassigned}
                  </div>
                </div>
                <div className={cn('shrink-0 text-right text-[11.5px]', isOverdue(task) ? 'text-[#ff8a96]' : 'text-[#c9b28c]')}>
                  {dueLabel(task.due_at)}
                </div>
              </Link>
            );
          })
        ) : (
          <p className="text-[12.5px] text-[#8f9a9f]">{copy.empty}</p>
        )}
      </div>
    </section>
  );
}