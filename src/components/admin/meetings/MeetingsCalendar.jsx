import { useMemo } from 'react';
import { t, dateLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Месячная сетка встреч: понедельник — первый день недели. */
export default function MeetingsCalendar({ meetings, month, onMonthChange, leadsById, statusLabels }) {
  const copy = t.admin.meetings;

  const cells = useMemo(() => {
    const first = startOfMonth(month);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const total = Math.ceil((offset + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, index) => {
      const day = new Date(month.getFullYear(), month.getMonth(), index - offset + 1);
      return {
        day,
        inMonth: day.getMonth() === month.getMonth(),
        items: meetings.filter((meeting) => {
          const starts = new Date(meeting.starts_at);
          return !Number.isNaN(starts.getTime()) && sameDay(starts, day);
        }),
      };
    });
  }, [meetings, month]);

  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(2024, 0, 1 + index);
        return date.toLocaleDateString(dateLocale(), { weekday: 'short' });
      }),
    []
  );

  const shift = (delta) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <div className="border border-white/10 bg-[#263033]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={() => shift(-1)}
          className="min-h-[32px] border border-white/12 px-3 text-[12px] text-white"
        >
          ←
        </button>
        <div className="text-[13px] font-semibold capitalize text-white">
          {month.toLocaleDateString(dateLocale(), { month: 'long', year: 'numeric' })}
        </div>
        <button
          type="button"
          onClick={() => shift(1)}
          className="min-h-[32px] border border-white/12 px-3 text-[12px] text-white"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-white/10">
        {weekdays.map((label, index) => (
          <div
            key={`${label}-${index}`}
            className="px-1 py-2 text-center text-[10px] uppercase tracking-[0.1em] text-[#778287]"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell, index) => {
          const isToday = sameDay(cell.day, new Date());
          return (
            <div
              key={index}
              className={cn(
                'min-h-[82px] border-b border-r border-white/8 p-1.5',
                cell.inMonth ? 'bg-transparent' : 'bg-black/20'
              )}
            >
              <div
                className={cn(
                  'text-[11px]',
                  isToday ? 'font-bold text-[#c8102e]' : cell.inMonth ? 'text-[#b0b8bc]' : 'text-[#5f6a6f]'
                )}
              >
                {cell.day.getDate()}
              </div>
              <div className="mt-1 space-y-1">
                {cell.items.slice(0, 2).map((meeting) => (
                  <div
                    key={meeting.id}
                    title={`${leadsById[meeting.lead_id] || ''} · ${statusLabels[meeting.status] || ''}`}
                    className="truncate bg-[#c8102e]/15 px-1 py-0.5 text-[10px] text-white"
                  >
                    {new Date(meeting.starts_at).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    {leadsById[meeting.lead_id] || copy.types[meeting.type] || ''}
                  </div>
                ))}
                {cell.items.length > 2 ? (
                  <div className="text-[10px] text-[#8f9a9f]">+{cell.items.length - 2}</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}