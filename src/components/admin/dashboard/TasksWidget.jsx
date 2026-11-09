import { Link } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { dueLabel, isDueToday, isOverdue, sortTasks } from '@/lib/tasks';

export default function TasksWidget({ tasks, userEmail }) {
  const copy = t.admin.tasks;
  const open = tasks.filter((task) => task.status === 'open');
  const dueToday = open.filter(isDueToday).length;
  const overdue = open.filter(isOverdue).length;
  const mine = sortTasks(open.filter((task) => (task.assignee || '') === (userEmail || '')));

  return (
    <div className="mt-4 border border-white/10 bg-[#263033] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#778287]">{copy.todayTitle}</div>
        <Link to="/admin/tasks" className="text-[11.5px] text-[#c9b28c] hover:text-white">
          {copy.allForLead}
        </Link>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-[#6f7a7f]">{copy.today}</div>
          <div className="mt-1 text-[24px] font-bold leading-none text-white">{dueToday}</div>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-[#6f7a7f]">{copy.overdue}</div>
          <div className={`mt-1 text-[24px] font-bold leading-none ${overdue ? 'text-[#ff8a96]' : 'text-white'}`}>
            {overdue}
          </div>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-[#6f7a7f]">{copy.mine}</div>
          <div className="mt-1 text-[24px] font-bold leading-none text-white">{mine.length}</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {mine.length ? (
          mine.slice(0, 4).map((task) => (
            <Link
              key={task.id}
              to={task.lead_id ? `/admin/leads/${task.lead_id}` : '/admin/tasks'}
              className="flex min-h-[38px] items-center justify-between gap-3 border border-white/8 px-3 py-1.5 hover:border-[#c8102e]/50"
            >
              <span className="truncate text-[12.5px] text-[#d7dcde]">{task.title}</span>
              <span className={`shrink-0 text-[11.5px] ${isOverdue(task) ? 'text-[#ff8a96]' : 'text-[#8f9a9f]'}`}>
                {dueLabel(task.due_at)}
              </span>
            </Link>
          ))
        ) : (
          <p className="text-[12.5px] text-[#8f9a9f]">{copy.leadEmpty}</p>
        )}
      </div>
    </div>
  );
}