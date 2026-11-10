import { Loader2, LogOut, ShieldAlert } from 'lucide-react';
import AdminPage from '@/components/AdminPage';
import AuthScreen from '@/components/AuthScreen';
import ChangeLogPage from '@/components/ChangeLogPage';
import { useAuth } from '@/hooks/useAuth';
import { useHashPath } from '@/hooks/useHashPath';

function AccessCard({ children, onSignOut }: { children: React.ReactNode; onSignOut: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-7 text-center shadow-sm">
        {children}
        <button
          type="button"
          onClick={onSignOut}
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-800 transition hover:border-stone-500"
        >
          <LogOut size={14} aria-hidden />
          خروج از حساب
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { state, signOut } = useAuth();
  const path = useHashPath();

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100">
        <Loader2 size={28} className="animate-spin text-teal-700" aria-label="در حال بارگذاری" />
      </div>
    );
  }

  if (state.status === 'signed-out') return <AuthScreen />;

  if (state.status === 'ready') {
    if (path === '/admin' && state.isAdmin) {
      return <AdminPage currentUserId={state.user.id} onSignOut={signOut} />;
    }
    return <ChangeLogPage userEmail={state.user.email ?? ''} isAdmin={state.isAdmin} onSignOut={signOut} />;
  }

  if (state.status === 'no-access') {
    return (
      <AccessCard onSignOut={signOut}>
        <ShieldAlert size={32} className="mx-auto text-amber-700" aria-hidden />
        <h1 className="mt-4 text-lg font-bold text-stone-900">دسترسی هنوز فعال نشده است</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          حساب شما ساخته شده است، اما برای مشاهده و ثبت علت تغییرات باید توسط مدیر سیستم تأیید شود.
        </p>
      </AccessCard>
    );
  }

  return (
    <AccessCard onSignOut={signOut}>
      <ShieldAlert size={32} className="mx-auto text-rose-700" aria-hidden />
      <h1 className="mt-4 text-lg font-bold text-stone-900">بررسی دسترسی انجام نشد</h1>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        اتصال به سرویس برقرار نشد. کمی بعد دوباره وارد شوید.
      </p>
    </AccessCard>
  );
}
