import { jalaliOfKey, toPersianDigits } from '@/lib/persianCalendar';
import type { CategoryStat, DayStat, UserStat } from '@/lib/reports';

const EXPLAINED_COLOR = '#38bdf8';
const MISSING_COLOR = '#fbbf24';
const TRACK_COLOR = '#e2e8f0';

export function CoverageDonut({ coverage, total }: { coverage: number; total: number }) {
  const ring = total
    ? `conic-gradient(${EXPLAINED_COLOR} 0 ${coverage}%, ${MISSING_COLOR} ${coverage}% 100%)`
    : `conic-gradient(${TRACK_COLOR} 0 100%)`;
  return (
    <div className="flex items-center gap-6">
      <div data-keep className="relative h-36 w-36 shrink-0 rounded-full" style={{ background: ring }} role="img" aria-label={`${coverage} درصد دارای علت`}>
        <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-stone-100">
          <span className="text-2xl font-bold text-stone-900">{toPersianDigits(coverage)}٪</span>
          <span className="text-xs text-stone-600">دارای علت</span>
        </div>
      </div>
      <ul className="flex flex-col gap-2 text-sm text-stone-800">
        <li className="flex items-center gap-2">
          <span data-keep className="h-3 w-3 rounded-sm" style={{ background: EXPLAINED_COLOR }} />
          دارای علت
        </li>
        <li className="flex items-center gap-2">
          <span data-keep className="h-3 w-3 rounded-sm" style={{ background: MISSING_COLOR }} />
          بدون علت
        </li>
      </ul>
    </div>
  );
}

export function CategoryBars({ categories, total }: { categories: CategoryStat[]; total: number }) {
  if (!categories.length) return <p className="text-sm text-stone-600">رویدادی برای نمایش نیست.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {categories.map((category) => {
        const share = total ? (category.total / total) * 100 : 0;
        const explainedShare = category.total ? (category.explained / category.total) * 100 : 0;
        return (
          <li key={category.key} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm">
            <span className="truncate text-stone-800">{category.label}</span>
            <div data-keep className="h-2.5 overflow-hidden rounded-full" style={{ background: TRACK_COLOR }}>
              <div className="flex h-full" style={{ width: `${share}%` }}>
                <div data-keep className="h-full" style={{ width: `${explainedShare}%`, background: EXPLAINED_COLOR }} />
                <div data-keep className="h-full flex-1" style={{ background: MISSING_COLOR }} />
              </div>
            </div>
            <span className="whitespace-nowrap text-stone-900">{toPersianDigits(category.total)} رویداد</span>
          </li>
        );
      })}
    </ul>
  );
}

export function DailyTrend({ days }: { days: DayStat[] }) {
  const max = Math.max(1, ...days.map((day) => day.total));
  return (
    <div className="flex h-44 items-end gap-2">
      {days.map((day) => {
        const height = (day.total / max) * 100;
        const explainedHeight = day.total ? (day.explained / day.total) * height : 0;
        return (
          <div key={day.dayKey} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-xs text-stone-700">{toPersianDigits(day.total)}</span>
            <div className="flex w-full max-w-[2.5rem] flex-col-reverse overflow-hidden rounded-t-md" style={{ height: `${height}%`, minHeight: 4 }}>
              <div data-keep style={{ height: `${explainedHeight}%`, background: EXPLAINED_COLOR }} />
              <div data-keep className="flex-1" style={{ background: MISSING_COLOR }} />
            </div>
            <span className="text-xs text-stone-600">{toPersianDigits(jalaliOfKey(day.dayKey).day)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function UserTable({ users }: { users: UserStat[] }) {
  if (!users.length) return <p className="text-sm text-stone-600">کاربری در این بازه ثبت نشده است.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-start text-xs text-stone-600">
            <th className="py-2 text-start font-medium">کاربر</th>
            <th className="py-2 text-center font-medium">رویداد</th>
            <th className="py-2 text-center font-medium">دارای علت</th>
            <th className="py-2 text-center font-medium">بدون علت</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.name} className="border-b border-stone-200/60 last:border-0">
              <td dir="ltr" className="py-2.5 text-start text-stone-900">{user.name}</td>
              <td className="py-2.5 text-center text-stone-900">{toPersianDigits(user.total)}</td>
              <td className="py-2.5 text-center text-stone-900">{toPersianDigits(user.explained)}</td>
              <td className="py-2.5 text-center font-medium text-amber-700">{toPersianDigits(user.total - user.explained)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
