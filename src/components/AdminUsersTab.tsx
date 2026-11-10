import { useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import AccountRow from '@/components/AccountRow';
import AddAccountForm from '@/components/AddAccountForm';
import { useAccounts } from '@/hooks/useAccounts';
import { useRoles } from '@/hooks/useRoles';
import { setAccountRole, setAdminAccess, setStaffAccess, type AccountRecord } from '@/lib/accounts';

interface AdminUsersTabProps {
  currentUserId: string;
}

type Filter = 'all' | 'pending' | 'active';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'pending', label: 'در انتظار تأیید' },
  { value: 'active', label: 'فعال' },
];

function matchesFilter(account: AccountRecord, filter: Filter): boolean {
  if (filter === 'pending') return !account.is_staff;
  if (filter === 'active') return account.is_staff;
  return true;
}

export default function AdminUsersTab({ currentUserId }: AdminUsersTabProps) {
  const { accounts, status, reload } = useAccounts();
  const { roles } = useRoles();
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);

  const visible = useMemo(() => accounts.filter((a) => matchesFilter(a, filter)), [accounts, filter]);
  const activeCount = accounts.filter((a) => a.is_staff).length;
  const adminCount = accounts.filter((a) => a.is_admin).length;

  const runAction = async (account: AccountRecord, action: () => Promise<void>) => {
    setBusyId(account.user_id);
    setActionError(null);
    try {
      await action();
      await reload();
    } catch {
      setActionError(`تغییر برای ${account.email} انجام نشد؛ دوباره تلاش کنید.`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
          <p className="text-xs text-stone-600">کل حساب‌ها</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{accounts.length}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
          <p className="text-xs text-stone-600">دسترسی فعال</p>
          <p className="mt-1 text-2xl font-bold text-teal-700">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
          <p className="text-xs text-stone-600">مدیران</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{adminCount}</p>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="فیلتر حساب‌ها" className="inline-flex rounded-lg border border-stone-300 p-1">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={filter === item.value}
              onClick={() => setFilter(item.value)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                filter === item.value ? 'bg-teal-700 font-medium text-white' : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((open) => !open)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-700 px-3 py-1.5 text-sm font-medium text-teal-700 transition hover:bg-teal-700 hover:text-white"
        >
          <UserPlus size={14} aria-hidden />
          افزودن کاربر
        </button>
      </div>

      {showAddForm && (
        <AddAccountForm
          roles={roles}
          onCreated={() => {
            setShowAddForm(false);
            void reload();
          }}
        />
      )}

      {actionError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {actionError}
        </p>
      )}

      {status === 'error' && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          فهرست حساب‌ها بارگذاری نشد. صفحه را تازه کنید.
        </p>
      )}

      {status === 'loading' && <p className="text-center text-sm text-stone-600">در حال بارگذاری…</p>}

      {status === 'ready' && visible.length === 0 && (
        <p className="text-center text-sm text-stone-600">حسابی در این فیلتر وجود ندارد.</p>
      )}

      {visible.length > 0 && (
        <ul className="flex flex-col gap-3">
          {visible.map((account) => (
            <AccountRow
              key={account.user_id}
              account={account}
              roles={roles}
              isSelf={account.user_id === currentUserId}
              busy={busyId === account.user_id}
              resetOpen={resetUserId === account.user_id}
              onToggleStaff={() => void runAction(account, () => setStaffAccess(account.user_id, !account.is_staff))}
              onToggleAdmin={() => void runAction(account, () => setAdminAccess(account.user_id, !account.is_admin))}
              onChangeRole={(role) => void runAction(account, () => setAccountRole(account.user_id, role))}
              onToggleReset={() => setResetUserId((current) => (current === account.user_id ? null : account.user_id))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
