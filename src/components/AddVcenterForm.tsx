import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { adminErrorMessage } from '@/lib/adminFunctions';
import { saveVcenterConnection } from '@/lib/vcenter';

interface AddVcenterFormProps {
  onSaved: () => void;
}

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-500 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/30';

export default function AddVcenterForm({ onSaved }: AddVcenterFormProps) {
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await saveVcenterConnection({ name: name.trim(), host: host.trim(), username: username.trim(), password });
      setPassword('');
      onSaved();
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
      <p className="text-sm font-semibold text-stone-900 sm:col-span-2">افزودن اتصال vCenter</p>
      <label className="text-xs text-stone-700">
        نام دلخواه
        <input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className={`${inputClass} mt-1`} />
      </label>
      <label className="text-xs text-stone-700">
        آدرس سرور (بدون https و مسیر)
        <input
          dir="ltr"
          required
          placeholder="vcenter.example.local"
          value={host}
          onChange={(event) => setHost(event.target.value)}
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-stone-700">
        نام کاربری حساب فقط‌خواندنی
        <input dir="ltr" required autoComplete="off" value={username} onChange={(event) => setUsername(event.target.value)} className={`${inputClass} mt-1`} />
      </label>
      <label className="text-xs text-stone-700">
        رمز عبور
        <input
          type="password"
          dir="ltr"
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={`${inputClass} mt-1`}
        />
      </label>
      <p className="text-xs text-stone-600 sm:col-span-2">
        رمز عبور فقط در سرور نگهداری می‌شود و پس از ذخیره دیگر نمایش داده نمی‌شود.
      </p>
      <div className="flex justify-end sm:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:opacity-45"
        >
          {submitting && <Loader2 size={14} className="animate-spin" aria-hidden />}
          ذخیره اتصال
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
