/** Рабочие часы агентства по Москве: 10:00–20:00. */
export function mskHour(date = new Date()) {
  const parts = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === 'hour')?.value;
  return Number(hour || 0) % 24;
}

export function outsideWorkingHours(date = new Date()) {
  const hour = mskHour(date);
  return hour < 10 || hour >= 20;
}