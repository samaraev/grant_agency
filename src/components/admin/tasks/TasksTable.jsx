import { Link } from 'react-router-dom';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { TASK_PRIORITY_TONE, TASK_STATUS_TONE, dueLabel, isOverdue } from '@/lib/tasks';

export default function TasksTable({ tasks, leadById, selected, onToggle, onDone, onEdit, onDelete }) {
  const copy = t.admin.tasks;

  return (
    <div className="overflow-x-auto border border-white/10">
      <table className="w-full min-w-[900px] text-left">
        <thead className="bg-[#1f272b] text-[10.5px] uppercase tracking-[0.14em] text-[#778287]">
          <tr>
            <th className="w-10 px-3 py-3" />
            <th className="px-3 py-3 font-medium">{copy.titleField}</th>
            <th className="px-3 py-3 font-medium">{copy.dueAt}</th>
            <th className="px-3 py-3 font-medium">{copy.assignee}</th>
            <th className="px-3 py-3 font-medium">{copy.statusField}</th>
            <th className="px-3 py-3 font-medium">{copy.priority}</th>
            <th className="px-3 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8 text-[13px]">
          {tasks.map((task) => {
            const lead = leadById[task.lead_id];
            const overdue = isOverdue(task);
            return (
              <tr key={task.id} className="bg-[#1a2025] hover:bg-white/[0.03]">
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    aria-label={copy.select}
                    checked={selected.includes(task.id)}
                    onChange={() => onToggle(task.id)}
                    className="h-3.5 w-3.5 accent-[#c8102e]"
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="text-white">{task.title}</div>
                  {lead ? (
                    <Link to={`/admin/leads/${lead.id}`} className="link-underline text-[11.5px] text-[#c9b28c]">
                      {[lead.name, lead.phone].filter(Boolean).join(' · ')}
                    </Link>
                  ) : null}
                  {task.notes ? <div className="mt-1 max-w-[380px] truncate text-[11.5px] text-[#8f9a9f]">{task.notes}</div> : null}
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <span className={overdue ? 'text-[#ff8a96]' : 'text-[#d7dcde]'}>{dueLabel(task.due_at)}</span>
                  {overdue ? (
                    <span className="ml-2 text-[10.5px] uppercase tracking-[0.1em] text-[#ff8a96]">{copy.overdueTag}</span>
                  ) : null}
                </td>
                <td className="px-3 py-3 text-[#b0b8bc]">{task.assignee || copy.unassigned}</td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      'whitespace-nowrap px-2 py-1 text-[10.5px] uppercase tracking-[0.1em]',
                      TASK_STATUS_TONE[task.status] || TASK_STATUS_TONE.open
                    )}
                  >
                    {copy.statuses[task.status] || task.status}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      'whitespace-nowrap px-2 py-1 text-[10.5px] uppercase tracking-[0.1em]',
                      TASK_PRIORITY_TONE[task.priority] || TASK_PRIORITY_TONE.normal
                    )}
                  >
                    {copy.priorities[task.priority] || task.priority}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <div className="flex items-center gap-1">
                    {task.status === 'open' ? (
                      <button
                        type="button"
                        onClick={() => onDone(task)}
                        title={copy.markDone}
                        aria-label={copy.markDone}
                        className="flex h-8 w-8 items-center justify-center border border-white/12 text-[#9aa4a8] hover:border-green-500/50 hover:text-green-300"
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onEdit(task)}
                      title={copy.editRow}
                      aria-label={copy.editRow}
                      className="flex h-8 w-8 items-center justify-center border border-white/12 text-[#9aa4a8] hover:border-[#c9b28c]/50 hover:text-white"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(task)}
                      title={copy.deleteRow}
                      aria-label={copy.deleteRow}
                      className="flex h-8 w-8 items-center justify-center border border-white/12 text-[#9aa4a8] hover:border-[#c8102e]/60 hover:text-[#ff8a96]"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}