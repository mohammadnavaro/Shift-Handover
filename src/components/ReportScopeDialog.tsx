import { useState, type FormEvent } from 'react';
import { CalendarDays, CalendarRange, Moon, Sun } from 'lucide-react';
import Modal from '@/components/Modal';
import { formatJalaliInput, keyFromJalali, toLatinDigits } from '@/lib/persianCalendar';
import type { ReportScope } from '@/lib/reports';
import { SHIFT_HOURS, SHIFT_LABELS } from '@/lib/shifts';

interface ReportScopeDialogProps {
  dayKey: string;
  onSelect: (scope: ReportScope) => void;
  onClose: () => void;
}

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-500 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20';

const RANGE_ERROR = 'تاریخ‌ها معتبر نیستند؛ تاریخ شروع باید قبل از پایان باشد. نمونه: ۱۴۰۵/۰۸/۱۴';

function parseJalaliKey(input: string): string | null {
  const match = toLatinDigits(input).trim().match(/^(\d{4})\D(\d{1,2})\D(\d{1,2})$/);
  if (!match) return null;
  return keyFromJalali({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) });
}

export default function ReportScopeDialog({ dayKey, onSelect, onClose }: ReportScopeDialogProps) {
  const [rangeOpen, setRangeOpen] = useState(false);
  const [from, setFrom] = useState(formatJalaliInput(dayKey));
  const [to, setTo] = useState(formatJalaliInput(dayKey));
  const [error, setError] = useState<string | null>(null);

  const submitRange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fromKey = parseJalaliKey(from);
    const toKey = parseJalaliKey(to);
    if (!fromKey || !toKey || fromKey > toKey) {
      setError(RANGE_ERROR);
      return;
    }
    onSelect({ type: 'range', from: fromKey, to: toKey });
  };

  const options = [
    { key: 'day', label: SHIFT_LABELS.day, hint: SHIFT_HOURS.day, icon: Sun, scope: { type: 'shift', dayKey, kind: 'day' } as const },
    { key: 'night', label: SHIFT_LABELS.night, hint: SHIFT_HOURS.night, icon: Moon, scope: { type: 'shift', dayKey, kind: 'night' } as const },
    { key: 'full-day', label: 'کل روز', hint: 'هر دو شیفت این روز', icon: CalendarDays, scope: { type: 'day', dayKey } as const },
  ];

  return (
    <Modal title="این روز را چطور گزارش بگیرم؟" subtitle="یکی از گزینه‌های زیر را انتخاب کنید." onClose={onClose} widthClass="max-w-xl">
      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onSelect(option.scope)}
              className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3.5 text-start transition hover:border-teal-600 hover:shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-700/15 text-teal-700">
                <Icon size={18} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-stone-900">{option.label}</span>
                <span className="block text-xs text-stone-600">{option.hint}</span>
              </span>
            </button>
          );
        })}

        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3.5">
          <button
            type="button"
            onClick={() => setRangeOpen((open) => !open)}
            aria-expanded={rangeOpen}
            className="flex w-full items-center gap-4 text-start"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-700/15 text-teal-700">
              <CalendarRange size={18} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-stone-900">بازه‌ی زمانی</span>
              <span className="block text-xs text-stone-600">گزارش چند روز با گروه‌بندی تسک‌ها</span>
            </span>
          </button>

          {rangeOpen && (
            <form onSubmit={submitRange} className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-stone-700">
                از تاریخ
                <input dir="ltr" value={from} onChange={(event) => setFrom(event.target.value)} className={`${inputClass} mt-1`} />
              </label>
              <label className="text-xs text-stone-700">
                تا تاریخ
                <input dir="ltr" value={to} onChange={(event) => setTo(event.target.value)} className={`${inputClass} mt-1`} />
              </label>
              {error && (
                <p role="alert" className="text-xs text-rose-700 sm:col-span-2">
                  {error}
                </p>
              )}
              <div className="flex justify-end sm:col-span-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
                >
                  ساخت گزارش
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
}
