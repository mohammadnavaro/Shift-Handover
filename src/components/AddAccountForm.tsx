import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { createAccount } from '@/lib/accounts';
import { adminErrorMessage } from '@/lib/adminFunctions';
import type { StaffRole } from '@/lib/roles';

interface AddAccountFormProps {
  roles: StaffRole[];
  onCreated: () => void;
}

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-500 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/30';

export default function AddAccountForm({ roles, onCreated }: AddAccountFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRole = role || roles[0]?.name || '';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createAccount({ email: email.trim(), password, role: selectedRole });
      setEmail('');
      setPassword('');
      onCreated();
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
      <p className="text-sm font-semibold text-stone-900 sm:col-span-2">افزودن کاربر جدید</p>
      <label className="text-xs text-stone-700">
        ایمیل
        <input
          type="email"
          dir="ltr"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-stone-700">
        رمز عبور اولیه (حداقل ۸ نویسه)
        <input
          type="password"
          dir="ltr"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-stone-700">
        نقش
        <select value={selectedRole} onChange={(event) => setRole(event.target.value)} className={`${inputClass} mt-1`}>
          {roles.map((item) => (
            <option key={item.name} value={item.name}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end justify-end">
        <button
          type="submit"
          disabled={submitting || !selectedRole}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:opacity-45"
        >
          {submitting && <Loader2 size={14} className="animate-spin" aria-hidden />}
          ساخت حساب
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 sm:col-span-2">
          {error}
        </p>
      )}
    </form>
  );
}
