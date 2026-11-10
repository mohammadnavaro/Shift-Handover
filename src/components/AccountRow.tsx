import { KeyRound, Loader2, ShieldCheck, ShieldOff, UserCheck, UserX } from 'lucide-react';
import ResetPasswordForm from '@/components/ResetPasswordForm';
import type { AccountRecord } from '@/lib/accounts';
import type { StaffRole } from '@/lib/roles';
import { dayKeyOf, formatJalaliShort } from '@/lib/persianCalendar';

interface AccountRowProps {
  account: AccountRecord;
  roles: StaffRole[];
  isSelf: boolean;
  busy: boolean;
  resetOpen: boolean;
  onToggleStaff: () => void;
  onToggleAdmin: () => void;
  onChangeRole: (role: string) => void;
  onToggleReset: () => void;
}

const actionClass =
  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-45';

export default function AccountRow({
  account,
  roles,
  isSelf,
  busy,
  resetOpen,
  onToggleStaff,
  onToggleAdmin,
  onChangeRole,
  onToggleReset,
}: AccountRowProps) {
  const statusLabel = account.is_admin ? 'مدیر' : account.is_staff ? 'فعال' : 'در انتظار تأیید';
  const statusTone = account.is_staff ? 'text-teal-700' : 'text-amber-700';

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p dir="ltr" className="truncate text-sm font-medium text-stone-900">
            {account.email}
            {isSelf && <span className="ms-2 text-xs text-stone-500">(شما)</span>}
          </p>
          <p className="mt-0.5 text-xs text-stone-600">
            <span className={statusTone}>{statusLabel}</span>
            <span className="mx-2">·</span>
            ثبت‌نام: {formatJalaliShort(dayKeyOf(new Date(account.created_at)))}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {account.is_staff && (
            <select
              aria-label="نقش کاربر"
              value={account.role ?? ''}
              onChange={(event) => onChangeRole(event.target.value)}
              disabled={busy}
              className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-900 focus:border-teal-700 focus:outline-none disabled:opacity-45"
            >
              {roles.map((role) => (
                <option key={role.name} value={role.name}>
                  {role.label}
                </option>
              ))}
            </select>
          )}
          {account.is_staff && (
            <button
              type="button"
              onClick={onToggleAdmin}
              disabled={busy || isSelf}
              className={`${actionClass} border-stone-300 text-stone-800 hover:border-stone-500`}
            >
              {account.is_admin ? <ShieldOff size={14} aria-hidden /> : <ShieldCheck size={14} aria-hidden />}
              {account.is_admin ? 'حذف نقش مدیر' : 'تعیین به‌عنوان مدیر'}
            </button>
          )}
          <button
            type="button"
            onClick={onToggleReset}
            disabled={busy}
            className={`${actionClass} border-stone-300 text-stone-800 hover:border-stone-500`}
          >
            <KeyRound size={14} aria-hidden />
            تغییر رمز
          </button>
          <button
            type="button"
            onClick={onToggleStaff}
            disabled={busy || isSelf}
            className={`${actionClass} ${
              account.is_staff ? 'border-rose-300 text-rose-700 hover:border-rose-500' : 'border-teal-700 bg-teal-700 text-white hover:bg-teal-800'
            }`}
          >
            {busy ? (
              <Loader2 size={14} className="animate-spin" aria-hidden />
            ) : account.is_staff ? (
              <UserX size={14} aria-hidden />
            ) : (
              <UserCheck size={14} aria-hidden />
            )}
            {account.is_staff ? 'لغو دسترسی' : 'تأیید دسترسی'}
          </button>
        </div>
      </div>

      {resetOpen && <ResetPasswordForm userId={account.user_id} email={account.email} onClose={onToggleReset} />}
    </li>
  );
}
