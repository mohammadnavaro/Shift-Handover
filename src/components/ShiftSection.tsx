import type { ChangeEvent, ReasonVersion } from '@/lib/changeLog';
import { toPersianDigits } from '@/lib/persianCalendar';
import { SHIFT_HOURS, SHIFT_LABELS, shiftElementId, type ShiftRef } from '@/lib/shifts';
import EventRow from '@/components/EventRow';
import { shiftBadgeClass } from '@/lib/shiftStyles';

interface ShiftSectionProps {
  shift: ShiftRef;
  events: ChangeEvent[];
  reasonsByEvent: Record<string, ReasonVersion[]>;
  isCurrent: boolean;
  isPicked: boolean;
  onSaveReason: (eventId: string, body: string) => Promise<void>;
}

export default function ShiftSection({
  shift,
  events,
  reasonsByEvent,
  isCurrent,
  isPicked,
  onSaveReason,
}: ShiftSectionProps) {
  const missing = events.filter((event) => !reasonsByEvent[event.id]?.length).length;

  return (
    <section
      id={shiftElementId(shift)}
      className={`scroll-mt-32 rounded-2xl py-4 transition ${
        isPicked ? 'ring-2 ring-teal-600 ring-offset-4 ring-offset-stone-100' : ''
      }`}
    >
      <header className="mb-3 flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-3 py-0.5 text-sm font-semibold ${shiftBadgeClass(shift.kind, isCurrent)}`}
        >
          {SHIFT_LABELS[shift.kind]}
        </span>
        <span className="text-sm text-stone-600">{SHIFT_HOURS[shift.kind]}</span>
        {isCurrent && (
          <span className="rounded-full border border-teal-700 px-2.5 text-xs font-medium text-teal-800">
            شیفت جاری
          </span>
        )}
        {events.length > 0 && (
          <span className={`ms-auto text-sm ${missing ? 'font-medium text-amber-800' : 'text-stone-600'}`}>
            {toPersianDigits(events.length)} رویداد ·{' '}
            {missing ? `${toPersianDigits(missing)} بدون علت` : 'همه توضیح داده شده'}
          </span>
        )}
      </header>

      {events.length === 0 ? (
        <p className="py-6 text-center text-sm text-stone-500">رویدادی ثبت نشده است</p>
      ) : (
        <div className="relative">
          <div aria-hidden className="absolute inset-y-0 start-1/2 hidden w-px -translate-x-1/2 bg-stone-300 md:block" />
          <ol className="relative flex flex-col gap-2">
            {events.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                versions={reasonsByEvent[event.id] ?? []}
                onSaveReason={onSaveReason}
              />
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
