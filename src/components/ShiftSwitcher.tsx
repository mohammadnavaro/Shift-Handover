import { X } from 'lucide-react';
import { formatJalaliLong, toPersianDigits } from '@/lib/persianCalendar';
import { SHIFT_HOURS, SHIFT_LABELS, type ShiftKind } from '@/lib/shifts';
import { shiftBadgeClass } from '@/lib/shiftStyles';

interface ShiftSwitcherProps {
  dayKey: string;
  counts: Record<ShiftKind, number>;
  activeKind: ShiftKind | null;
  onPickShift: (kind: ShiftKind) => void;
  onClear: () => void;
}

export default function ShiftSwitcher({ dayKey, counts, activeKind, onPickShift, onClear }: ShiftSwitcherProps) {
  const kinds: ShiftKind[] = ['day', 'night'];

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="min-w-0 flex-1 basis-56">
        <p className="text-sm font-bold text-stone-900">{formatJalaliLong(dayKey)}</p>
        <p className="text-xs text-stone-600" dir="ltr">
          {dayKey}
        </p>
      </div>

      <div role="group" aria-label="انتخاب شیفت" className="flex overflow-hidden rounded-lg border border-stone-300">
        {kinds.map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={activeKind === kind}
            onClick={() => onPickShift(kind)}
            className={`flex flex-col items-center px-4 py-2 text-start transition first:border-e first:border-stone-300 ${
              activeKind === kind ? shiftBadgeClass(kind, true) : 'text-stone-800 hover:bg-stone-100'
            }`}
          >
            <span className="text-sm font-medium">{SHIFT_LABELS[kind]}</span>
            <span className="text-xs opacity-80">
              {SHIFT_HOURS[kind]} · {toPersianDigits(counts[kind])} رویداد
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1 text-sm text-stone-600 transition hover:text-stone-900"
      >
        <X size={14} aria-hidden />
        پاک کردن انتخاب
      </button>
    </div>
  );
}
