import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { resetAccountPassword } from '@/lib/accounts';
import { adminErrorMessage } from '@/lib/adminFunctions';

interface ResetPasswordFormProps {
  userId: string;
  email: string;
  onClose: () => void;
}

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-500 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/30';

export default function ResetPasswordForm({ userId, email, onClose }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await resetAccountPassword(userId, password);
      setPassword('');
      setDone(true);
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-teal-700/40 bg-teal-50 px-3 py-2 text-sm text-teal-800">
        <span>رمز عبور {email} تغییر کرد.</span>
        <button type="button" onClick={onClose} className="text-xs font-medium hover:underline">
          بستن
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3 sm:flex-row sm:items-end">
      <label className="flex-1 text-xs text-stone-700">
        رمز عبور جدید برای {email} (حداقل ۸ نویسه)
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
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || password.length < 8}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-teal-800 disabled:opacity-45"
        >
          {submitting && <Loader2 size={14} className="animate-spin" aria-hidden />}
          ثبت رمز جدید
        </button>
        <button type="button" onClick={onClose} className="rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-800 hover:border-stone-500">
          انصراف
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-rose-700 sm:basis-full">
          {error}
        </p>
      )}
    </form>
  );
}
