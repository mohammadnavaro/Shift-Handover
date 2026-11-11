import { useState } from 'react';
import { FileText, Lock, Loader2 } from 'lucide-react';
import EventRow from '@/components/EventRow';
import type { ChangeEvent, ReasonVersion } from '@/lib/changeLog';
import { groupByCategory } from '@/lib/eventCategories';
import { toPersianDigits } from '@/lib/persianCalendar';
import { SHIFT_HOURS, SHIFT_LABELS, shiftElementId, type ShiftRef } from '@/lib/shifts';
import { shiftBadgeClass } from '@/lib/shiftStyles';

interface ShiftSectionProps {
  shift: ShiftRef;
  events: ChangeEvent[];
  reasonsByEvent: Record<string, ReasonVersion[]>;
  isCurrent: boolean;
  isPicked: boolean;
  isClosed: boolean;
  canClose: boolean;
  onSaveReason: (eventId: string, body: string) => Promise<void>;
  onOpenReport: (shift: ShiftRef) => void;
  onCloseShift: (shift: ShiftRef) => Promise<void>;
}

const actionClass =
  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-45';

export default function ShiftSection({
  shift,
  events,
  reasonsByEvent,
  isCurrent,
  isPicked,
  isClosed,
  canClose,
  onSaveReason,
  onOpenReport,
  onCloseShift,
}: ShiftSectionProps) {
  const missing = events.filter((event) => !reasonsByEvent[event.id]?.length).length;
  const groups = groupByCategory(events);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  const handleClose = async () => {
    setClosing(true);
    setCloseError(null);
    try {
      await onCloseShift(shift);
    } catch {
      setCloseError('بستن شیفت انجام نشد؛ دوباره تلاش کنید.');
    } finally {
      setClosing(false);
    }
  };

  return (
    <section
      id={shiftElementId(shift)}
      className={`scroll-mt-32 rounded-2xl py-4 transition ${
        isPicked ? 'ring-2 ring-teal-600 ring-offset-4 ring-offset-stone-100' : ''
      }`}
    >
      <header className="mb-3 flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-0.5 text-sm font-semibold ${shiftBadgeClass(shift.kind, isCurrent)}`}>
          {SHIFT_LABELS[shift.kind]}
        </span>
        <span className="text-sm text-stone-600">{SHIFT_HOURS[shift.kind]}</span>
        {isCurrent && (
          <span className="rounded-full border border-teal-700 px-2.5 text-xs font-medium text-teal-800">شیفت جاری</span>
        )}
        {events.length > 0 && (
          <span className={`ms-auto text-sm ${missing ? 'font-medium text-amber-800' : 'text-stone-600'}`}>
            {toPersianDigits(events.length)} رویداد ·{' '}
            {missing ? `${toPersianDigits(missing)} بدون علت` : 'همه توضیح داده شده'}
          </span>
        )}
        {isClosed && (
          <button type="button" onClick={() => onOpenReport(shift)} className={`${actionClass} border-sky-400 text-sky-300 hover:bg-sky-400/10`}>
            <FileText size={14} aria-hidden />
            گزارش شیفت
          </button>
        )}
        {canClose && (
          <button
            type="button"
            onClick={() => void handleClose()}
            disabled={closing}
            className={`${actionClass} border-stone-300 text-stone-800 hover:border-stone-500`}
          >
            {closing ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Lock size={14} aria-hidden />}
            بستن شیفت
          </button>
        )}
      </header>

      {closeError && (
        <p role="alert" className="mb-3 text-sm text-rose-700">
          {closeError}
        </p>
      )}

      {events.length === 0 ? (
        <p className="py-6 text-center text-sm text-stone-500">رویدادی ثبت نشده است</p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div key={group.key} className="rounded-2xl border border-stone-200 bg-white/60 p-4">
              <div dir="ltr" className="mb-3 flex items-center gap-3">
                <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-900 ring-1 ring-stone-300">
                  {group.label}
                </span>
                <span className="text-xs text-stone-600">{toPersianDigits(group.items.length)} رویداد</span>
              </div>
              <div className="relative">
                <div aria-hidden className="absolute inset-y-0 start-1/2 hidden w-px -translate-x-1/2 bg-stone-300 md:block" />
                <ol className="relative flex flex-col gap-2">
                  {group.items.map((event) => (
                    <EventRow
                      key={event.id}
                      event={event}
                      versions={reasonsByEvent[event.id] ?? []}
                      onSaveReason={onSaveReason}
                    />
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
