import { Clock } from 'lucide-react';
import {
  dayKeyOf,
  formatTime,
  jalaliOfKey,
  PERSIAN_MONTHS,
  toPersianDigits,
  weekdayOfKey,
} from '@/lib/persianCalendar';
import { SHIFT_HOURS, SHIFT_LABELS, shiftOf } from '@/lib/shifts';
import { SHIFT_PANEL_CLASSES } from '@/lib/shiftStyles';

interface StatusBarProps {
  now: Date;
}

export default function StatusBar({ now }: StatusBarProps) {
  const todayKey = dayKeyOf(now);
  const today = jalaliOfKey(todayKey);
  const shift = shiftOf(now);

  return (
    <section
      aria-label="امروز و شیفت جاری"
      className="grid overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm sm:grid-cols-2"
    >
      <div className="flex items-center gap-5 p-5">
        <span className="text-5xl font-bold leading-none text-teal-700">{toPersianDigits(today.day)}</span>
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-bold text-stone-900">
            {PERSIAN_MONTHS[today.month - 1]} {toPersianDigits(today.year)}
          </p>
          <p className="text-sm text-stone-600">
            {weekdayOfKey(todayKey)} · <span dir="ltr">{todayKey}</span>
          </p>
        </div>
      </div>

      <div className={`flex items-center gap-5 p-5 ${SHIFT_PANEL_CLASSES[shift.kind]}`}>
        <span className="inline-flex items-center gap-2 text-5xl font-bold leading-none tabular-nums">
          <Clock size={28} aria-hidden />
          {formatTime(now)}
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-bold">{SHIFT_LABELS[shift.kind]}</p>
          <p className="text-sm">{SHIFT_HOURS[shift.kind]}</p>
        </div>
      </div>
    </section>
  );
}
