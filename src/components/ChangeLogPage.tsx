import { useEffect, useMemo, useState } from 'react';
import { LogOut, ScrollText, ShieldCheck } from 'lucide-react';
import ShiftSection from '@/components/ShiftSection';
import ShiftSwitcher from '@/components/ShiftSwitcher';
import StatusBar from '@/components/StatusBar';
import DayPicker from '@/components/DayPicker';
import { useChangeLog } from '@/hooks/useChangeLog';
import { useNow } from '@/hooks/useNow';
import { saveReason, type ReasonVersion } from '@/lib/changeLog';
import { dayKeyOf, formatJalaliShort, weekdayOfKey } from '@/lib/persianCalendar';
import {
  groupEventsByShift,
  shiftElementId,
  shiftGroupKey,
  shiftOf,
  type ShiftKind,
  type ShiftRef,
} from '@/lib/shifts';

interface ChangeLogPageProps {
  userEmail: string;
  isAdmin: boolean;
  onSignOut: () => void;
}

const SHIFT_KINDS: ShiftKind[] = ['day', 'night'];

function scrollToShift(shift: ShiftRef) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document
    .getElementById(shiftElementId(shift))
    ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}

export default function ChangeLogPage({ userEmail, isAdmin, onSignOut }: ChangeLogPageProps) {
  const { events, reasons, status, reload } = useChangeLog();
  const now = useNow();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [pickedShift, setPickedShift] = useState<ShiftRef | null>(null);

  const currentShift = shiftOf(now);
  const groups = useMemo(() => groupEventsByShift(events), [events]);

  const reasonsByEvent = useMemo(() => {
    const map: Record<string, ReasonVersion[]> = {};
    for (const reason of reasons) {
      const list = map[reason.event_id];
      if (list) list.push(reason);
      else map[reason.event_id] = [reason];
    }
    return map;
  }, [reasons]);

  const eventDays = useMemo(
    () => new Set(events.map((event) => shiftOf(new Date(event.occurred_at)).dayKey)),
    [events]
  );

  const dayKeys = useMemo(() => {
    const keys = new Set([...eventDays, dayKeyOf(now), currentShift.dayKey]);
    if (selectedDay) keys.add(selectedDay);
    return [...keys].sort().reverse();
  }, [eventDays, now, currentShift.dayKey, selectedDay]);

  useEffect(() => {
    if (pickedShift) scrollToShift(pickedShift);
  }, [pickedShift]);

  const countFor = (dayKey: string, kind: ShiftKind) => groups.get(shiftGroupKey(dayKey, kind))?.length ?? 0;

  const handlePickDay = (dayKey: string) => {
    setSelectedDay(dayKey);
    const kind = dayKey === currentShift.dayKey ? currentShift.kind : 'day';
    setPickedShift({ dayKey, kind });
  };

  const handleClear = () => {
    setSelectedDay(null);
    setPickedShift(null);
  };

  const handleSaveReason = async (eventId: string, body: string) => {
    await saveReason(eventId, body);
    await reload();
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white">
              <ScrollText size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-stone-900">دفترچه‌ی تغییرات vCenter</h1>
              <p className="truncate text-xs text-stone-600" dir="ltr">
                {userEmail}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isAdmin && (
              <a
                href="#/admin"
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-800 transition hover:border-stone-500"
              >
                <ShieldCheck size={14} aria-hidden />
                پنل مدیریت
              </a>
            )}
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-800 transition hover:border-stone-500"
            >
              <LogOut size={14} aria-hidden />
              خروج
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-20 pt-6">
        <StatusBar now={now} />

        <div className="sticky top-16 z-20 -mx-5 mt-6 border-b border-stone-200 bg-stone-100/95 px-5 py-3 shadow-sm backdrop-blur">
          <DayPicker
            selectedDay={selectedDay}
            eventDays={eventDays}
            onPickDay={handlePickDay}
            onClear={handleClear}
          />
        </div>

        {selectedDay && (
          <ShiftSwitcher
            dayKey={selectedDay}
            counts={{ day: countFor(selectedDay, 'day'), night: countFor(selectedDay, 'night') }}
            activeKind={pickedShift?.dayKey === selectedDay ? pickedShift.kind : null}
            onPickShift={(kind) => setPickedShift({ dayKey: selectedDay, kind })}
            onClear={handleClear}
          />
        )}

        {status === 'error' && (
          <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            بارگذاری داده‌ها ممکن نشد؛ در حال تلاش مجدد هستیم. اگر ادامه داشت، صفحه را تازه کنید.
          </p>
        )}

        {status === 'loading' && (
          <p className="mt-10 text-center text-sm text-stone-600">در حال بارگذاری رویدادها…</p>
        )}

        <div
          dir="ltr"
          className="mt-8 hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-5 px-2 text-sm font-medium text-stone-600 md:grid"
        >
          <span>رویداد</span>
          <span className="text-center">زمان</span>
          <span className="text-end">علت</span>
        </div>

        {dayKeys.map((dayKey) => (
          <section key={dayKey} className="mt-8 border-t border-stone-300 pt-6">
            <h2 className="mb-2 flex flex-wrap items-baseline gap-3 text-lg font-bold text-stone-900">
              <span>
                {weekdayOfKey(dayKey)} {formatJalaliShort(dayKey)}
              </span>
              <span className="text-sm font-normal text-stone-600" dir="ltr">
                {dayKey}
              </span>
            </h2>
            {SHIFT_KINDS.map((kind) => {
              const shift = { dayKey, kind };
              return (
                <ShiftSection
                  key={kind}
                  shift={shift}
                  events={groups.get(shiftGroupKey(dayKey, kind)) ?? []}
                  reasonsByEvent={reasonsByEvent}
                  isCurrent={currentShift.dayKey === dayKey && currentShift.kind === kind}
                  isPicked={pickedShift?.dayKey === dayKey && pickedShift.kind === kind}
                  onSaveReason={handleSaveReason}
                />
              );
            })}
          </section>
        ))}
      </main>
    </div>
  );
}
