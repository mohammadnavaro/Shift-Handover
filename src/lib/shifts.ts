import { addDaysToKey, dayKeyOf, tehranParts } from '@/lib/persianCalendar';

export type ShiftKind = 'day' | 'night';

export interface ShiftRef {
  dayKey: string;
  kind: ShiftKind;
}

export const SHIFT_LABELS: Record<ShiftKind, string> = {
  day: 'شیفت روز',
  night: 'شیفت شب',
};

export const SHIFT_HOURS: Record<ShiftKind, string> = {
  day: '۰۷:۰۰ تا ۱۹:۰۰',
  night: '۱۹:۰۰ تا ۰۷:۰۰',
};

export function shiftOf(date: Date): ShiftRef {
  const { hour } = tehranParts(date);
  const today = dayKeyOf(date);
  if (hour < 7) return { dayKey: addDaysToKey(today, -1), kind: 'night' };
  return { dayKey: today, kind: hour < 19 ? 'day' : 'night' };
}

export function shiftGroupKey(dayKey: string, kind: ShiftKind): string {
  return `${dayKey}|${kind}`;
}

export function shiftElementId({ dayKey, kind }: ShiftRef): string {
  return `shift-${dayKey}-${kind}`;
}

export function groupEventsByShift<T extends { occurred_at: string }>(events: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const event of events) {
    const ref = shiftOf(new Date(event.occurred_at));
    const key = shiftGroupKey(ref.dayKey, ref.kind);
    const list = groups.get(key);
    if (list) list.push(event);
    else groups.set(key, [event]);
  }
  return groups;
}
