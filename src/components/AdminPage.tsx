import { useState } from 'react';
import { ArrowRight, LogOut, Network, ShieldCheck, UserCog, Users } from 'lucide-react';
import AdminUsersTab from '@/components/AdminUsersTab';
import AdminRolesTab from '@/components/AdminRolesTab';
import AdminVcenterTab from '@/components/AdminVcenterTab';

interface AdminPageProps {
  currentUserId: string;
  onSignOut: () => void;
}

type Tab = 'users' | 'roles' | 'vcenter';

const TABS: { value: Tab; label: string; icon: typeof Users }[] = [
  { value: 'users', label: 'کاربران', icon: Users },
  { value: 'roles', label: 'نقش‌ها', icon: UserCog },
  { value: 'vcenter', label: 'اتصال vCenter', icon: Network },
];

export default function AdminPage({ currentUserId, onSignOut }: AdminPageProps) {
  const [tab, setTab] = useState<Tab>('users');

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white">
              <ShieldCheck size={18} aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-stone-900">پنل مدیریت</h1>
              <a href="#/" className="inline-flex items-center gap-1 text-xs text-teal-700 hover:underline">
                <ArrowRight size={12} aria-hidden />
                بازگشت به دفترچه
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-800 transition hover:border-stone-500"
          >
            <LogOut size={14} aria-hidden />
            خروج
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-20 pt-6">
        <div role="tablist" aria-label="بخش‌های مدیریت" className="inline-flex flex-wrap gap-1 rounded-lg border border-stone-300 p-1">
          {TABS.map((item) => {
            const Icon = item.icon;
            const selected = tab === item.value;
            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(item.value)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ${
                  selected ? 'bg-teal-700 font-medium text-white' : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                <Icon size={14} aria-hidden />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {tab === 'users' && <AdminUsersTab currentUserId={currentUserId} />}
          {tab === 'roles' && <AdminRolesTab />}
          {tab === 'vcenter' && <AdminVcenterTab />}
        </div>
      </main>
    </div>
  );
}
