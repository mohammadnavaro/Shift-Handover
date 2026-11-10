import type { ChangeEvent, ReasonVersion } from '@/lib/changeLog';
import { formatTime } from '@/lib/persianCalendar';
import ReasonBox from '@/components/ReasonBox';

interface EventRowProps {
  event: ChangeEvent;
  versions: ReasonVersion[];
  onSaveReason: (eventId: string, body: string) => Promise<void>;
}

export default function EventRow({ event, versions, onSaveReason }: EventRowProps) {
  return (
    <li
      dir="ltr"
      className="grid grid-cols-1 gap-3 py-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-start md:gap-5"
    >
      <div className="order-2 min-w-0 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm md:order-none">
        <p className="break-words text-sm text-stone-900">{event.summary}</p>
        <p className="mt-1 text-xs text-stone-600">{event.user_name}</p>
      </div>

      <div className="order-first flex justify-center md:order-none md:relative md:z-10">
        <span className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-center text-xs text-stone-600">
          <b className="block text-sm font-medium text-stone-900">{formatTime(new Date(event.occurred_at))}</b>
        </span>
      </div>

      <div className="order-3 min-w-0 md:order-none">
        <ReasonBox
          label={event.summary}
          versions={versions}
          onSave={(body) => onSaveReason(event.id, body)}
        />
      </div>
    </li>
  );
}
