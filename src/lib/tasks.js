// Задачи: даты, просрочка и порядок вывода. Общее для страницы, карточки обращения и виджетов.

import { dateLocale } from '@/lib/i18n';

export const TASK_STATUSES = ['open', 'done', 'cancelled'];
export const TASK_PRIORITIES = ['low', 'normal', 'high'];

const PRIORITY_ORDER = { high: 0, normal: 1, low: 2 };

export const TASK_STATUS_TONE = {
  open: 'bg-blue-500/15 text-blue-300',
  done: 'bg-green-500/15 text-green-300',
  cancelled: 'bg-white/10 text-[#9aa4a8]',
};

export const TASK_PRIORITY_TONE = {
  high: 'bg-red-500/15 text-red-300',
  normal: 'bg-blue-500/15 text-blue-300',
  low: 'bg-white/10 text-[#9aa4a8]',
};

export function asDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isOverdue(task) {
  const due = asDate(task?.due_at);
  return task?.status === 'open' && Boolean(due) && due.getTime() < Date.now();
}

export function isDueToday(task) {
  const due = asDate(task?.due_at);
  if (!due) return false;
  const now = new Date();
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

/** «09.11, 14:00» — без года, год не нужен в операционных списках. */
export function dueLabel(value) {
  const date = asDate(value);
  if (!date) return '—';
  return date.toLocaleString(dateLocale(), {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function leadLabel(lead) {
  return [lead?.name, lead?.phone].filter(Boolean).join(' · ');
}

/** Срок по возрастанию, затем приоритет: высокий первым. */
export function sortTasks(list) {
  return [...list].sort((a, b) => {
    const left = asDate(a.due_at)?.getTime() || 0;
    const right = asDate(b.due_at)?.getTime() || 0;
    if (left !== right) return left - right;
    return (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
  });
}