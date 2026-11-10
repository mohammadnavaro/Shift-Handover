import { useState, type KeyboardEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  CALENDAR_WEEKDAY_HEADERS,
  daysInJalaliMonth,
  dayKeyOf,
  formatJalaliInput,
  jalaliOfKey,
  keyFromJalali,
  PERSIAN_MONTHS,
  toLatinDigits,
  toPersianDigits,
  utcWeekdayOfKey,
} from '@/lib/persianCalendar';

interface DayPickerProps {
  selectedDay: string | null;
  eventDays: Set<string>;
  onPickDay: (dayKey: string) => void;
  onClear: () => void;
}

interface CalendarMonth {
  year: number;
  month: number;
}

const INVALID_DATE_MESSAGE = 'تاریخ معتبر نیست. نمونه: ۱۴۰۵/۰۸/۱۴';

function currentMonth(): CalendarMonth {
  const { year, month } = jalaliOfKey(dayKeyOf(new Date()));
  return { year, month };
}

export default function DayPicker({ selectedDay, eventDays, onPickDay, onClear }: DayPickerProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [view, setView] = useState<CalendarMonth>(currentMonth);

  const pick = (dayKey: string) => {
    setInput(formatJalaliInput(dayKey));
    setError(null);
    setCalendarOpen(false);
    onPickDay(dayKey);
  };

  const submit = () => {
    const match = toLatinDigits(input).trim().match(/^(\d{4})\D(\d{1,2})\D(\d{1,2})$/);
    const key = match ? keyFromJalali({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }) : null;
    if (!key) {
      setError(INVALID_DATE_MESSAGE);
      return;
    }
    pick(key);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
  };

  const toggleCalendar = () => {
    if (!calendarOpen) {
      const base = selectedDay ? jalaliOfKey(selectedDay) : null;
      setView(base ? { year: base.year, month: base.month } : currentMonth());
    }
    setCalendarOpen(!calendarOpen);
  };

  const moveMonth = (delta: number) => {
    setView((previous) => {
      const index = previous.year * 12 + (previous.month - 1) + delta;
      return { year: Math.floor(index / 12), month: (index % 12) + 1 };
    });
  };

  const todayKey = dayKeyOf(new Date());
  const monthLength = daysInJalaliMonth(view.year, view.month);
  const firstKey = keyFromJalali({ year: view.year, month: view.month, day: 1 });
  const leadingBlanks = firstKey ? (utcWeekdayOfKey(firstKey) + 1) % 7 : 0;
  const days = Array.from({ length: monthLength }, (_, index) => index + 1);

  return (
    <section aria-label="جست‌وجوی روز" className="relative rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <label htmlFor="day-search" className="mb-2 block text-sm font-medium text-stone-800">
        جست‌وجوی روز در تقویم شمسی
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="day-search"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          dir="ltr"
          placeholder="۱۴۰۵/۰۸/۱۴"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 basis-44 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        />
        <button
          type="button"
          onClick={submit}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
        >
          برو
        </button>
        <button
          type="button"
          onClick={toggleCalendar}
          aria-expanded={calendarOpen}
          aria-controls="day-calendar"
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 transition hover:border-stone-500"
        >
          <CalendarDays size={16} aria-hidden />
          تقویم
        </button>
        <button
          type="button"
          onClick={() => pick(todayKey)}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 transition hover:border-stone-500"
        >
          امروز
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {calendarOpen && (
        <div id="day-calendar" className="absolute start-4 top-full z-30 mt-2 w-80 max-w-[calc(100%-2rem)] rounded-xl border border-slate-700 bg-slate-900 p-3 text-slate-100 shadow-lg shadow-black/30">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              aria-label="ماه قبل"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-200 transition hover:bg-slate-800"
            >
              <ChevronRight size={18} />
            </button>
            <strong className="text-sm text-slate-100">
              {PERSIAN_MONTHS[view.month - 1]} {toPersianDigits(view.year)}
            </strong>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              aria-label="ماه بعد"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-200 transition hover:bg-slate-800"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {CALENDAR_WEEKDAY_HEADERS.map((letter) => (
              <span key={letter} className="py-1 text-xs text-slate-400">
                {letter}
              </span>
            ))}
            {Array.from({ length: leadingBlanks }, (_, index) => (
              <span key={`blank-${index}`} />
            ))}
            {days.map((day) => {
              const key = keyFromJalali({ year: view.year, month: view.month, day });
              const selected = key !== null && key === selectedDay;
              const isToday = key === todayKey;
              const hasEvents = key !== null && eventDays.has(key);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={key === null}
                  onClick={() => {
                    if (key) pick(key);
                  }}
                  aria-label={`${toPersianDigits(day)} ${PERSIAN_MONTHS[view.month - 1]} ${toPersianDigits(view.year)}`}
                  aria-pressed={selected}
                  className={`relative h-9 rounded-lg text-sm transition disabled:opacity-30 ${
                    selected
                      ? 'bg-sky-500 font-semibold text-slate-950 hover:bg-sky-400'
                      : 'text-slate-100 hover:bg-slate-800'
                  } ${isToday && !selected ? 'ring-1 ring-sky-400' : ''}`}
                >
                  {toPersianDigits(day)}
                  {hasEvents && (
                    <span
                      className={`absolute bottom-1 start-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                        selected ? 'bg-slate-950' : 'bg-sky-400'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
