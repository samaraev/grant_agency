// Экспорт встречи в .ics — открывается в календаре на телефоне или в почте.

function pad(value) {
  return String(value).padStart(2, '0');
}

function stamp(date) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function escapeText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function meetingIcs(meeting, lead) {
  const starts = new Date(meeting.starts_at);
  const ends = new Date(starts.getTime() + 60 * 60000);
  const address = meeting.address || lead?.address_text || '';
  const title = `Встреча: ${lead?.name || 'клиент'}`;
  const description = [lead?.phone ? `Телефон: ${lead.phone}` : '', meeting.responsible ? `Ведёт: ${meeting.responsible}` : '']
    .filter(Boolean)
    .join('\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GRANT//Meetings//RU',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${meeting.id}@grant`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(starts)}`,
    `DTEND:${stamp(ends)}`,
    `SUMMARY:${escapeText(title)}`,
    `LOCATION:${escapeText(address)}`,
    `DESCRIPTION:${escapeText(description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(meeting, lead) {
  const blob = new Blob([meetingIcs(meeting, lead)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `vstrecha-${String(meeting.starts_at || '').slice(0, 10)}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}