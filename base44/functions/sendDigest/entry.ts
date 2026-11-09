import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const MSK_OFFSET_MIN = 180;
const DAY_MS = 86400000;
const APP_URL = 'https://grant-home-inside.base44.app';

function text(value, max = 2000) {
  return String(value === undefined || value === null ? '' : value).trim().slice(0, max);
}

function toMinutes(value, fallback) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || ''));
  if (!match) return fallback;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Рабочие минуты (Пн–Пт, окно агентства) между двумя моментами. */
function workingMinutesBetween(fromMs, toMs, settings) {
  const start = toMinutes(settings.working_hours_start, 600);
  const end = toMinutes(settings.working_hours_end, 1200);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs || end <= start) return 0;
  let total = 0;
  const firstDay = Math.floor((fromMs + MSK_OFFSET_MIN * 60000) / DAY_MS) * DAY_MS - MSK_OFFSET_MIN * 60000;
  for (let i = 0; i < 400; i += 1) {
    const dayStart = firstDay + i * DAY_MS;
    if (dayStart >= toMs) break;
    const weekday = new Date(dayStart + MSK_OFFSET_MIN * 60000).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    const a = Math.max(fromMs, dayStart + start * 60000);
    const b = Math.min(toMs, dayStart + end * 60000);
    if (b > a) total += (b - a) / 60000;
  }
  return Math.round(total);
}

function workedLabel(minutes) {
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}

function mskDayBounds(now) {
  const todayStart = Math.floor((now + MSK_OFFSET_MIN * 60000) / DAY_MS) * DAY_MS - MSK_OFFSET_MIN * 60000;
  return { todayStart, todayEnd: todayStart + DAY_MS };
}

function digestText(settings, leads, meetings, now) {
  const { todayStart, todayEnd } = mskDayBounds(now);
  const open = leads.filter((lead) => !['non_target', 'deal_closed'].includes(lead.status));
  const fresh = leads.filter((lead) => {
    const created = new Date(lead.created_date).getTime();
    return now - created <= DAY_MS;
  });
  const slaMinutes = Number(settings.first_response_sla_minutes) || 30;
  const overdue = open
    .filter((lead) => !lead.first_response_at)
    .map((lead) => {
      const created = new Date(lead.created_date).getTime();
      return { lead, worked: workingMinutesBetween(created, now, settings) };
    })
    .filter((row) => row.worked > slaMinutes)
    .sort((a, b) => b.worked - a.worked);

  const todayMeetings = meetings.filter((meeting) => {
    const starts = new Date(meeting.starts_at).getTime();
    return starts >= todayStart && starts < todayEnd;
  });
  const dueActions = open.filter((lead) => {
    const due = lead.next_action_date ? new Date(lead.next_action_date).getTime() : NaN;
    return Number.isFinite(due) && due < todayEnd;
  });
  const withoutNext = open.filter((lead) => !lead.next_action_date);

  const lines = [
    `ГРАНТ · Дайджест ${new Date(now).toLocaleDateString('ru-RU')}`,
    '',
    `Новых обращений за сутки: ${fresh.length}`,
    `Просрочен первый ответ: ${overdue.length} (норматив ${slaMinutes} мин рабочих часов)`,
    `Встречи сегодня: ${todayMeetings.length}`,
    `Следующие действия на сегодня: ${dueActions.length}`,
    `Без следующего шага: ${withoutNext.length}`,
    '',
  ];

  if (overdue.length) {
    lines.push('Просроченные обращения:');
    overdue.slice(0, 10).forEach((row) => {
      lines.push(`· ${row.lead.name || row.lead.phone} — прошло ${workedLabel(row.worked)} (${row.lead.status})`);
    });
    lines.push('');
  }
  if (todayMeetings.length) {
    lines.push('Встречи сегодня:');
    todayMeetings.slice(0, 10).forEach((meeting) => {
      const time = new Date(meeting.starts_at).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Moscow',
      });
      lines.push(`· ${time} — ${meeting.address || 'адрес не указан'}`);
    });
    lines.push('');
  }

  lines.push(`Открыть страницу «Сегодня»: ${APP_URL}/admin/today`);
  return lines.join('\n');
}

function reportText(report, metrics) {
  const lines = [
    `ГРАНТ · Отчёт (${report.period_type === 'month' ? 'месяц' : 'неделя'})`,
    `Период: ${new Date(report.period_start).toLocaleDateString('ru-RU')} — ${
      report.period_end ? new Date(report.period_end).toLocaleDateString('ru-RU') : ''
    }`,
    '',
    'ЦИФРЫ',
    `Обращений: ${metrics.leads ?? 0}`,
    `Квалифицированных разговоров: ${metrics.qualified ?? 0}`,
    `Встреч проведено: ${metrics.meetingsHeld ?? 0}`,
    `Договоров подписано: ${metrics.contracts ?? 0}`,
    `Сделок: ${metrics.deals ?? 0}`,
    `Нецелевых: ${metrics.nonTarget ?? 0}`,
    `Из Хамовников: ${metrics.khamovniki ?? 0}`,
    `Конверсия в квалификацию: ${metrics.conversion ?? 0}%`,
    '',
    'ЧТО СДЕЛАНО',
    text(report.done_text, 4000) || '—',
    '',
    'ЧТО ВНЕДРЕНО',
    text(report.implemented_text, 4000) || '—',
    '',
    'ЧТО ПРОВЕРЕНО',
    text(report.checked_text, 4000) || '—',
    '',
    'КАКИЕ ДАННЫЕ ПОЛУЧЕНЫ',
    text(report.data_text, 4000) || '—',
    '',
    'ЧТО ЗАБЛОКИРОВАНО',
    text(report.blocked_text, 4000) || '—',
    '',
    'ЧТО ДЕЛАЕМ ДАЛЬШЕ',
    text(report.next_text, 4000) || '—',
    '',
    APP_URL + '/admin/reports',
  ];
  return lines.join('\n');
}

/** Дайджест для администраторов: режим digest (09:30) или отправка сохранённого отчёта. */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    // ВРЕМЕННО (демо): дайджест можно отправить и без входа. Для продакшена вернуть проверку роли.
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const mode = body.mode === 'report' ? 'report' : 'digest';

    const settingsPage = await base44.asServiceRole.entities.AdminSettings.list({ limit: 1 }).catch(() => null);
    const settings = settingsPage?.items?.[0] || {};

    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' }, '-created_date', 50).catch(
      () => []
    );
    const recipients = [
      ...new Set(
        [
          settings.admin_email,
          settings.default_responsible,
          settings.backup_responsible,
          ...admins.map((item) => item.email),
        ]
          .map((email) => text(email, 160))
          .filter(Boolean)
      ),
    ].slice(0, 5);

    if (!recipients.length) {
      return Response.json({ ok: false, sent: 0, error: 'Не задана почта администратора в настройках' });
    }

    const now = Date.now();
    let subject = '';
    let message = '';
    let reportId = '';

    if (mode === 'report') {
      reportId = text(body.report_id, 100);
      if (!reportId) return Response.json({ error: 'Не указан отчёт' }, { status: 400 });
      const report = await base44.asServiceRole.entities.Report.get(reportId).catch((e) =>
        e.status === 404 ? null : Promise.reject(e)
      );
      if (!report) return Response.json({ error: 'Отчёт не найден' }, { status: 404 });
      let metrics = {};
      try {
        metrics = report.metrics ? JSON.parse(report.metrics) : {};
      } catch {
        metrics = {};
      }
      subject = `ГРАНТ · Отчёт за ${new Date(report.period_start).toLocaleDateString('ru-RU')}`;
      message = reportText(report, metrics);
    } else {
      const [leadPage, meetingPage] = await Promise.all([
        base44.asServiceRole.entities.Lead.list({ sort: '-created_date', limit: 300 }).catch(() => ({ items: [] })),
        base44.asServiceRole.entities.Meeting.list({ sort: 'starts_at', limit: 200 }).catch(() => ({ items: [] })),
      ]);
      subject = `ГРАНТ · Дайджест ${new Date(now).toLocaleDateString('ru-RU')}`;
      message = digestText(settings, leadPage?.items || [], meetingPage?.items || [], now);
    }

    let sent = 0;
    const errors = [];
    for (const to of recipients) {
      try {
        const result = await base44.asServiceRole.integrations.Core.SendEmail({
          to,
          subject,
          body: message,
          from_name: text(settings.email_from_name, 120) || undefined,
          category: 'transactional',
        });
        if (result && result.success === false) {
          errors.push(`${to}: ${result.message || result.reason || 'send_failed'}`);
        } else {
          sent += 1;
        }
      } catch (error) {
        errors.push(`${to}: ${error.message}`);
      }
    }

    if (mode === 'report' && sent > 0 && reportId) {
      await base44.asServiceRole.entities.Report.update(reportId, { sent_at: new Date().toISOString() });
    }

    return Response.json({
      ok: sent > 0,
      sent,
      recipients,
      errors,
      error: sent > 0 ? '' : errors[0] || 'Отправка не удалась',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}