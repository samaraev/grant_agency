import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { requireAdminOrDemo } from '../../shared/guards.ts';

/**
 * Напоминания по задачам: открытые задачи без отметки reminder_sent,
 * срок которых наступил или наступит в ближайшие 24 часа.
 * Одно письмо на ответственного. После отправки reminder_sent = true (повторный запуск ничего не отправит).
 * Возвращает { sent, skipped, by_assignee }.
 */
const WINDOW_MS = 24 * 60 * 60 * 1000;

const formatDue = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const denied = await requireAdminOrDemo(base44);
    if (denied) return denied;

    const now = new Date();
    const limit = new Date(now.getTime() + WINDOW_MS).toISOString();

    const page = await base44.asServiceRole.entities.Task.filter(
      {
        status: 'open',
        reminder_sent: false,
        due_at: { $lte: limit },
      },
      { sort: 'due_at', limit: 300 }
    );

    const tasks = page?.items || [];
    const groups = new Map();
    let skipped = 0;

    tasks.forEach((task) => {
      const assignee = (task.assignee || '').trim().toLowerCase();
      if (!assignee) {
        skipped += 1;
        return;
      }
      if (!groups.has(assignee)) groups.set(assignee, []);
      groups.get(assignee).push(task);
    });

    const byAssignee = {};
    const done = [];
    const failed = [];
    let sent = 0;

    for (const [assignee, list] of groups) {
      const overdue = list.filter((task) => new Date(task.due_at) < now).length;
      const lines = list
        .map((task) => `— ${formatDue(task.due_at)} · ${task.title}${task.lead_id ? ' (обращение)' : ''}`)
        .join('\n');
      const subject =
        list.length === 1 ? 'Задача на сегодня или просрочена' : `Задачи на сегодня и просроченные: ${list.length}`;
      const body = [
        'Здравствуйте!',
        '',
        `Задач в работе: ${list.length}${overdue ? `, просрочено: ${overdue}` : ''}.`,
        '',
        lines,
        '',
        'Открыть задачи: https://grant-home-inside.base44.app/admin/tasks',
      ].join('\n');

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: assignee,
          subject,
          body,
          from_name: 'ГРАНТ — Дом изнутри',
          category: 'transactional',
        });
        sent += 1;
        byAssignee[assignee] = list.length;
        done.push(...list.map((task) => task.id));
      } catch (error) {
        failed.push({ assignee, error: error.message });
      }
    }

    if (done.length) {
      const stamp = new Date().toISOString();
      const patches = done.map((id) => ({ id, reminder_sent: true, updated_at: stamp }));
      for (let i = 0; i < patches.length; i += 100) {
        await base44.asServiceRole.entities.Task.bulkUpdate(patches.slice(i, i + 100));
      }
    }

    return Response.json({
      sent,
      skipped,
      by_assignee: byAssignee,
      failed,
      checked: tasks.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}