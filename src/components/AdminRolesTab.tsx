import { useState, type FormEvent } from 'react';
import { Loader2, Pencil, Plus, ShieldCheck } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { upsertRole, type StaffRole } from '@/lib/roles';

const ROLE_NAME_PATTERN = '[a-z][a-z0-9\\-]{1,31}';

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-500 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/30';

const EMPTY_FORM = { name: '', label: '', canWriteReasons: true };

export default function AdminRolesTab() {
  const { roles, status, reload } = useRoles();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = (role: StaffRole) => {
    setEditing(true);
    setError(null);
    setForm({ name: role.name, label: role.label, canWriteReasons: role.can_write_reasons });
  };

  const resetForm = () => {
    setEditing(false);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await upsertRole({ name: form.name, label: form.label.trim(), can_write_reasons: form.canWriteReasons });
      resetForm();
      await reload();
    } catch {
      setError('ذخیره نقش انجام نشد؛ دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
        <p className="text-sm font-semibold text-stone-900 sm:col-span-2">
          {editing ? 'ویرایش نقش' : 'افزودن نقش جدید'}
        </p>
        <label className="text-xs text-stone-700">
          شناسه انگلیسی (حروف کوچک، عدد و خط تیره)
          <input
            dir="ltr"
            required
            pattern={ROLE_NAME_PATTERN}
            readOnly={editing}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value.trim().toLowerCase() })}
            className={`${inputClass} mt-1 read-only:opacity-60`}
          />
        </label>
        <label className="text-xs text-stone-700">
          عنوان نقش
          <input
            required
            maxLength={60}
            value={form.label}
            onChange={(event) => setForm({ ...form, label: event.target.value })}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-800 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.canWriteReasons}
            onChange={(event) => setForm({ ...form, canWriteReasons: event.target.checked })}
            className="h-4 w-4 accent-teal-500"
          />
          این نقش می‌تواند علت تغییرات را ثبت و ویرایش کند
        </label>
        <div className="flex justify-end gap-2 sm:col-span-2">
          {editing && (
            <button type="button" onClick={resetForm} className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 hover:border-stone-500">
              انصراف
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:opacity-45"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Plus size={14} aria-hidden />}
            {editing ? 'ذخیره تغییرات' : 'افزودن نقش'}
          </button>
        </div>
        {error && (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 sm:col-span-2">
            {error}
          </p>
        )}
      </form>

      {status === 'error' && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          فهرست نقش‌ها بارگذاری نشد. صفحه را تازه کنید.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {roles.map((role) => (
          <li key={role.name} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-900">{role.label}</p>
              <p dir="ltr" className="mt-0.5 text-xs text-stone-600">
                {role.name}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span
                className={`inline-flex items-center gap-1 text-xs ${role.can_write_reasons ? 'text-teal-700' : 'text-stone-600'}`}
              >
                <ShieldCheck size={14} aria-hidden />
                {role.can_write_reasons ? 'ثبت علت' : 'فقط مشاهده'}
              </span>
              <button
                type="button"
                onClick={() => startEdit(role)}
                className="inline-flex items-center gap-1 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs text-stone-800 hover:border-stone-500"
              >
                <Pencil size={12} aria-hidden />
                ویرایش
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
