import type { ChangeEvent, ReasonVersion } from '@/lib/changeLog';
import { TASK_CATEGORY_LABELS, taskCategoryOf, type TaskCategoryKey } from '@/lib/eventCategories';
import { formatJalaliShort, weekdayOfKey } from '@/lib/persianCalendar';
import { SHIFT_LABELS, shiftOf, type ShiftKind, type ShiftRef } from '@/lib/shifts';

export type ReportScope =
  | { type: 'shift'; dayKey: string; kind: ShiftKind }
  | { type: 'day'; dayKey: string }
  | { type: 'range'; from: string; to: string };

export interface UserStat {
  name: string;
  total: number;
  explained: number;
}

export interface CategoryStat {
  key: TaskCategoryKey;
  label: string;
  total: number;
  explained: number;
}

export interface DayStat {
  dayKey: string;
  total: number;
  explained: number;
}

export interface ShiftStat {
  kind: ShiftKind;
  total: number;
  explained: number;
}

export interface ReportStats {
  total: number;
  explained: number;
  missing: number;
  coverage: number;
  users: UserStat[];
  categories: CategoryStat[];
  days: DayStat[];
  shifts: ShiftStat[];
}

function matchesScope(scope: ReportScope, ref: ShiftRef): boolean {
  if (scope.type === 'shift') return ref.dayKey === scope.dayKey && ref.kind === scope.kind;
  if (scope.type === 'day') return ref.dayKey === scope.dayKey;
  return ref.dayKey >= scope.from && ref.dayKey <= scope.to;
}

function bump<K, V extends { total: number; explained: number }>(map: Map<K, V>, key: K, make: () => V, explained: boolean) {
  const entry = map.get(key) ?? make();
  entry.total += 1;
  if (explained) entry.explained += 1;
  map.set(key, entry);
}

export function computeReport(
  events: ChangeEvent[],
  reasons: ReasonVersion[],
  scope: ReportScope
): ReportStats {
  const explainedIds = new Set(reasons.map((reason) => reason.event_id));
  const users = new Map<string, UserStat>();
  const categories = new Map<TaskCategoryKey, CategoryStat>();
  const days = new Map<string, DayStat>();
  const shifts = new Map<ShiftKind, ShiftStat>();
  let total = 0;
  let explained = 0;

  for (const event of events) {
    const ref = shiftOf(new Date(event.occurred_at));
    if (!matchesScope(scope, ref)) continue;

    const isExplained = explainedIds.has(event.id);
    const key = taskCategoryOf(event.operation);
    total += 1;
    if (isExplained) explained += 1;
    bump(users, event.user_name || 'نامشخص', () => ({ name: event.user_name || 'نامشخص', total: 0, explained: 0 }), isExplained);
    bump(categories, key, () => ({ key, label: TASK_CATEGORY_LABELS[key], total: 0, explained: 0 }), isExplained);
    bump(days, ref.dayKey, () => ({ dayKey: ref.dayKey, total: 0, explained: 0 }), isExplained);
    bump(shifts, ref.kind, () => ({ kind: ref.kind, total: 0, explained: 0 }), isExplained);
  }

  return {
    total,
    explained,
    missing: total - explained,
    coverage: total ? Math.round((explained / total) * 100) : 0,
    users: [...users.values()].sort((a, b) => b.total - a.total),
    categories: [...categories.values()].sort((a, b) => b.total - a.total),
    days: [...days.values()].sort((a, b) => a.dayKey.localeCompare(b.dayKey)),
    shifts: [...shifts.values()],
  };
}

export function scopeTitle(scope: ReportScope): string {
  if (scope.type === 'shift') return `${weekdayOfKey(scope.dayKey)} ${formatJalaliShort(scope.dayKey)} · ${SHIFT_LABELS[scope.kind]}`;
  if (scope.type === 'day') return `${weekdayOfKey(scope.dayKey)} ${formatJalaliShort(scope.dayKey)} · کل روز`;
  return `${formatJalaliShort(scope.from)} تا ${formatJalaliShort(scope.to)}`;
}
