import { useState, type KeyboardEvent } from 'react';
import { Pencil } from 'lucide-react';
import type { ReasonVersion } from '@/lib/changeLog';
import { formatPersianDateTime } from '@/lib/persianCalendar';

interface ReasonBoxProps {
  label: string;
  versions: ReasonVersion[];
  onSave: (body: string) => Promise<void>;
}

const MAX_LENGTH = 2000;

function saveErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  return code === '42501' ? 'اجازه‌ی ثبت علت ندارید.' : 'ذخیره نشد؛ دوباره تلاش کنید.';
}

export default function ReasonBox({ label, versions, onSave }: ReasonBoxProps) {
  const latest = versions.length ? versions[versions.length - 1] : null;
  const history = versions.slice(0, -1).reverse();
  const [editing, setEditing] = useState(!latest);
  const [draft, setDraft] = useState(latest?.body ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const trimmed = draft.trim();
  const canSave = trimmed.length > 0 && trimmed.length <= MAX_LENGTH && trimmed !== latest?.body && !saving;

  const startEditing = () => {
    setDraft(latest?.body ?? '');
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setError(null);
    setEditing(false);
  };

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch (err) {
      setError(saveErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void submit();
    }
  };

  const buttonBase = 'inline-flex h-6 items-center justify-center rounded-md border px-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-45';

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="relative">
        <textarea
          dir="rtl"
          aria-label={`علت: ${label}`}
          placeholder="علت این تغییر را بنویسید…"
          maxLength={MAX_LENGTH}
          readOnly={!editing}
          value={editing ? draft : latest?.body ?? ''}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          className={`block min-h-[64px] w-full resize-y rounded-xl border px-3 pb-9 pt-2.5 text-sm leading-7 text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/30 ${
            editing
              ? `bg-white focus:border-teal-600 ${!draft.trim() ? 'border-dashed border-stone-300' : 'border-stone-300'}`
              : 'cursor-default resize-none border-transparent bg-transparent px-0'
          }`}
        />
        <div className="absolute bottom-2 start-2 flex gap-1">
          {editing ? (
            <>
              {latest && (
                <button
                  type="button"
                  onClick={cancel}
                  className={`${buttonBase} border-stone-300 bg-white text-stone-700 hover:border-stone-500`}
                >
                  انصراف
                </button>
              )}
              <button
                type="button"
                onClick={() => void submit()}
                disabled={!canSave}
                className={`${buttonBase} border-teal-700 bg-teal-700 text-white hover:bg-teal-800`}
              >
                {saving ? '…' : 'ثبت'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              title="ویرایش"
              aria-label="ویرایش علت"
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-600 transition hover:border-stone-500 hover:text-stone-900"
            >
              <Pencil size={12} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-rose-700">
          {error}
        </p>
      )}

      {!editing && latest && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
          <span>{latest.author_email} · {formatPersianDateTime(latest.created_at)}</span>
          {history.length > 0 && (
            <>
              <span className="text-stone-500">· ویرایش شده</span>
              <button
                type="button"
                onClick={() => setShowHistory((open) => !open)}
                aria-expanded={showHistory}
                className="underline underline-offset-2 hover:text-stone-900"
              >
                {showHistory ? 'پنهان کردن مقدار قبلی' : 'نمایش مقدار قبلی'}
              </button>
            </>
          )}
        </div>
      )}

      {showHistory && history.length > 0 && (
        <ul className="flex flex-col gap-2 border-s-2 border-stone-200 ps-3 text-xs text-stone-600">
          {history.map((version) => (
            <li key={version.id} dir="rtl" className="leading-6">
              <span className="text-stone-800">{version.body}</span>
              <span className="block text-stone-500">
                {version.author_email} · {formatPersianDateTime(version.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
