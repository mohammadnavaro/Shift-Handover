import { supabase } from '@/lib/supabase';

export class AdminRequestError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = 'AdminRequestError';
    this.code = code;
  }
}

export async function invokeAdminFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T & { error?: string }>(name, { body });
  if (error) {
    let code = 'unknown';
    try {
      const payload = (await (error as { context?: Response }).context?.json()) as { error?: string } | undefined;
      if (payload?.error) code = payload.error;
    } catch {
      // Response body was not JSON; keep the generic code.
    }
    throw new AdminRequestError(code);
  }
  return data as T;
}

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: 'نشست شما معتبر نیست. دوباره وارد شوید.',
  forbidden: 'این کار فقط برای مدیران مجاز است.',
  invalid_email: 'ایمیل وارد شده معتبر نیست.',
  weak_password: 'رمز عبور باید حداقل ۸ نویسه باشد.',
  invalid_role: 'نقش انتخاب‌شده معتبر نیست.',
  unknown_role: 'نقش انتخاب‌شده وجود ندارد.',
  email_exists: 'این ایمیل قبلاً ثبت شده است.',
  invalid_user: 'حساب انتخاب‌شده معتبر نیست.',
  reset_failed: 'تغییر رمز عبور انجام نشد؛ دوباره تلاش کنید.',
  create_failed: 'ساخت حساب انجام نشد؛ دوباره تلاش کنید.',
  invalid_name: 'نام اتصال معتبر نیست.',
  invalid_host: 'آدرس سرور باید فقط نام میزبان یا IP باشد (بدون https:// و مسیر).',
  missing_credentials: 'نام کاربری و رمز عبور را وارد کنید.',
  save_failed: 'ذخیره اتصال انجام نشد؛ دوباره تلاش کنید.',
  not_found: 'اتصال مورد نظر پیدا نشد.',
  check_failed: 'بررسی اتصال انجام نشد؛ دوباره تلاش کنید.',
};

export function adminErrorMessage(error: unknown): string {
  const code = error instanceof AdminRequestError ? error.code : 'unknown';
  return ERROR_MESSAGES[code] ?? 'انجام نشد؛ دوباره تلاش کنید.';
}
