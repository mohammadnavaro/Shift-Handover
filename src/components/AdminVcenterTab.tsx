import { useState } from 'react';
import { CircleDashed, Loader2, Network, RefreshCw } from 'lucide-react';
import AddVcenterForm from '@/components/AddVcenterForm';
import { adminErrorMessage } from '@/lib/adminFunctions';
import { checkVcenterConnection, type VcenterConnection } from '@/lib/vcenter';
import { useVcenterConnections } from '@/hooks/useVcenterConnections';

const checkedAtFormatter = new Intl.DateTimeFormat('fa-IR', {
  timeZone: 'Asia/Tehran',
  dateStyle: 'short',
  timeStyle: 'short',
});

function healthBadge(connection: VcenterConnection) {
  if (connection.last_status === 'ok') {
    return { label: 'متصل', className: 'text-teal-700', Icon: Network };
  }
  if (connection.last_status === 'error') {
    return { label: 'قطع یا خطا', className: 'text-rose-700', Icon: Network };
  }
  return { label: 'بررسی نشده', className: 'text-stone-600', Icon: CircleDashed };
}

export default function AdminVcenterTab() {
  const { connections, status, reload } = useVcenterConnections();
  const [showAddForm, setShowAddForm] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async (id: string) => {
    setCheckingId(id);
    setError(null);
    try {
      await checkVcenterConnection(id);
      await reload();
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setCheckingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowAddForm((open) => !open)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-700 px-3 py-1.5 text-sm font-medium text-teal-700 transition hover:bg-teal-700 hover:text-white"
        >
          <Network size={14} aria-hidden />
          افزودن اتصال
        </button>
      </div>

      {showAddForm && (
        <AddVcenterForm
          onSaved={() => {
            setShowAddForm(false);
            void reload();
          }}
        />
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      )}

      {status === 'error' && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          فهرست اتصال‌ها بارگذاری نشد. صفحه را تازه کنید.
        </p>
      )}

      {status === 'ready' && connections.length === 0 && (
        <p className="text-center text-sm text-stone-600">هنوز اتصالی ثبت نشده است.</p>
      )}

      <ul className="flex flex-col gap-3">
        {connections.map((connection) => {
          const badge = healthBadge(connection);
          const Icon = badge.Icon;
          const checking = checkingId === connection.id;
          return (
            <li key={connection.id} className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-900">{connection.name}</p>
                <p dir="ltr" className="mt-0.5 truncate text-xs text-stone-600">
                  {connection.host} · {connection.username}
                </p>
                <p className={`mt-1 inline-flex items-center gap-1 text-xs ${badge.className}`}>
                  <Icon size={12} aria-hidden />
                  {badge.label}
                  {connection.last_checked_at && (
                    <span className="text-stone-600">
                      {' · '}
                      {checkedAtFormatter.format(new Date(connection.last_checked_at))}
                    </span>
                  )}
                </p>
                {connection.last_message && <p className="mt-1 text-xs text-stone-700">{connection.last_message}</p>}
              </div>
              <button
                type="button"
                onClick={() => void runCheck(connection.id)}
                disabled={checking}
                className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-800 transition hover:border-stone-500 disabled:opacity-45 sm:self-center"
              >
                {checking ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <RefreshCw size={14} aria-hidden />}
                بررسی اتصال
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
