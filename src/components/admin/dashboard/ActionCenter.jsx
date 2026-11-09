import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { t } from '@/lib/i18n';
import { dueLabel, isOverdue } from '@/lib/tasks';

const URGENT = 'text-[#ff8a96]';

function ActionCard({ to, label, children, sub, urgent }) {
  return (
    <Link
      to={to}
      className="block border border-white/10 bg-[#1f272b] p-5 transition-colors hover:border-[#c9b28c]/60"
    >
      <div className="eyebrow">{label}</div>
      <div className={`mt-3 text-[32px] font-bold leading-none ${urgent ? URGENT : 'text-white'}`}>
        {children}
      </div>
      {sub ? <div className="mt-2 text-[11px] leading-snug text-[#6f7a7f]">{sub}</div> : null}
    </Link>
  );
}

export default function ActionCenter({ sla, slaHint, tasksToday, tasksOverdue, newLeads, urgent, onDone, savingId }) {
  const c = t.admin.dashboard;

  return (
    <section className="border border-white/10 border-l-4 border-l-[#c8102e] bg-[#263033] p-6">
      <div className="eyebrow">{c.todayMarker}</div>
      <h2 className="mt-2 font-heading text-[24px] leading-tight text-white">{c.attention}</h2>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <ActionCard
          to="/admin/leads"
          label={c.slaOverdue}
          sub={slaHint}
          urgent={sla > 0}
        >
          {sla}
        </ActionCard>

        <ActionCard
          to="/admin/tasks"
          label={c.tasksCard}
          sub={c.tasksBreakdown}
          urgent={tasksOverdue > 0}
        >
          <span className={tasksOverdue > 0 ? URGENT : 'text-white'}>{tasksOverdue}</span>
          <span className="mx-2 text-[18px] font-normal text-[#6f7a7f]">/</span>
          <span>{tasksToday}</span>
        </ActionCard>

        <ActionCard
          to="/admin/leads"
          label={c.newLeadsCard}
          sub={c.newLeadsHint}
          urgent={newLeads > 0}
        >
          {newLeads}
        </ActionCard>
      </div>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3 border-t border-white/10 pt-4">
        <div className="eyebrow">{c.urgentTasks}</div>
        <Link to="/admin/tasks" className="text-[11.5px] text-[#c9b28c] hover:text-white">
          {c.allTasks}
        </Link>
      </div>

      {urgent.length ? (
        <ul className="mt-2 divide-y divide-white/8">
          {urgent.map((task) => (
            <li key={task.id} className="flex items-center gap-3 py-2">
              <button
                type="button"
                onClick={() => onDone(task)}
                disabled={savingId === task.id}
                title={c.markDone}
                aria-label={c.markDone}
                className="flex h-5 w-5 shrink-0 items-center justify-center border border-white/25 text-transparent transition-colors hover:border-[#c9b28c] hover:text-[#c9b28c] disabled:opacity-40"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <Link
                to={task.lead_id ? `/admin/leads/${task.lead_id}` : '/admin/tasks'}
                className="min-w-0 flex-1 truncate text-[12.5px] text-[#d7dcde] hover:text-white"
              >
                {task.title}
              </Link>
              <span
                className={`shrink-0 text-[11.5px] ${isOverdue(task) ? URGENT : 'text-[#8f9a9f]'}`}
              >
                {dueLabel(task.due_at)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[12.5px] text-[#6f7a7f]">{c.noUrgentTasks}</p>
      )}
    </section>
  );
}