import type { ShiftKind } from '@/lib/shifts';

const BADGE_CLASSES: Record<ShiftKind, string> = {
  day: 'bg-amber-400/15 text-amber-100 ring-1 ring-amber-400/40',
  night: 'bg-sky-400/15 text-sky-100 ring-1 ring-sky-400/40',
};

const CURRENT_BADGE_CLASSES: Record<ShiftKind, string> = {
  day: 'bg-amber-300 text-slate-950 ring-1 ring-amber-200',
  night: 'bg-sky-300 text-slate-950 ring-1 ring-sky-200',
};

export const SHIFT_PANEL_CLASSES: Record<ShiftKind, string> = {
  day: 'bg-amber-400/10 text-amber-100',
  night: 'bg-sky-400/10 text-sky-100',
};

export function shiftBadgeClass(kind: ShiftKind, emphasized = false): string {
  return emphasized ? CURRENT_BADGE_CLASSES[kind] : BADGE_CLASSES[kind];
}
