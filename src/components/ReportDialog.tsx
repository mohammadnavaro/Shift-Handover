import { type ReactNode } from 'react';
import { CalendarClock, Printer, Users } from 'lucide-react';
import Modal from '@/components/Modal';
import { CategoryBars, CoverageDonut, DailyTrend, UserTable } from '@/components/ReportCharts';
import { toPersianDigits } from '@/lib/persianCalendar';
import { computeReport, scopeTitle, type ReportScope } from '@/lib/reports';
import { SHIFT_HOURS, SHIFT_LABELS } from '@/lib/shifts';
import type { ChangeEvent, ReasonVersion } from '@/lib/changeLog';

interface ReportDialogProps {
  scope: ReportScope;
  events: ChangeEvent[];
  reasons: ReasonVersion[];
  onClose: () => void;
}

function KpiCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Users; tone: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between text-xs text-stone-600">
        <span>{label}</span>
        <Icon size={14} aria-hidden className={tone} />
      </div>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{toPersianDigits(value)}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-stone-900">{title}</h3>
      {children}
    </section>
  );
}

export default function ReportDialog({ scope, events, reasons, onClose }: ReportDialogProps) {
  const stats = computeReport(events, reasons, scope);
  const title = scopeTitle(scope);
  const subtitle = scope.type === 'shift' ? SHIFT_HOURS[scope.kind] : 'گزارش تغییرات vCenter';

  const printReport = () => window.print();

  return (
    <Modal
      title={`گزارش: ${title}`}
      subtitle={subtitle}
      onClose={onClose}
      widthClass="max-w-4xl"
      actions={
        <button
          type="button"
          onClick={printReport}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-teal-800"
        >
          <Printer size={14} aria-hidden />
          دریافت PDF
        </button>
      }
    >
      <div id="report-print-area" className="flex flex-col gap-5">
        <div className="print-only hidden">
          <h1 className="text-xl font-bold">گزارش: {title}</h1>
          <p>{subtitle}</p>
        </div>

        {stats.total === 0 ? (
          <p className="rounded-xl border border-stone-200 bg-white px-4 py-10 text-center text-sm text-stone-600">
            در این بازه رویدادی ثبت نشده است.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KpiCard label="کل رویدادها" value={stats.total} icon={CalendarClock} tone="text-stone-900" />
              <KpiCard label="دارای علت" value={stats.explained} icon={CalendarClock} tone="text-sky-300" />
              <KpiCard label="بدون علت" value={stats.missing} icon={CalendarClock} tone="text-amber-300" />
              <KpiCard label="کاربران فعال" value={stats.users.length} icon={Users} tone="text-stone-900" />
            </div>

            <div className="grid gap-5 md:grid-cols-[auto_1fr]">
              <Card title="پوشش ثبت علت">
                <CoverageDonut coverage={stats.coverage} total={stats.total} />
              </Card>
              <Card title="تعداد رویداد به تفکیک نوع تسک">
                <CategoryBars categories={stats.categories} total={stats.total} />
              </Card>
            </div>

            {stats.days.length > 1 && (
              <Card title="روند رویدادها در بازه">
                <DailyTrend days={stats.days} />
              </Card>
            )}

            {scope.type !== 'shift' && (
              <Card title="تفکیک شیفت‌ها">
                <div className="grid gap-3 sm:grid-cols-2">
                  {stats.shifts.map((shift) => (
                    <div key={shift.kind} className="rounded-xl border border-stone-200 bg-stone-100 px-4 py-3">
                      <p className="text-sm font-semibold text-stone-900">{SHIFT_LABELS[shift.kind]}</p>
                      <p className="mt-1 text-xs text-stone-600">
                        {toPersianDigits(shift.total)} رویداد · {toPersianDigits(shift.explained)} دارای علت
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card title="فعالیت کاربران">
              <UserTable users={stats.users} />
            </Card>
          </>
        )}
      </div>
    </Modal>
  );
}
