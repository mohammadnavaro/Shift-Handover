const DAY_MS = 24 * 60 * 60 * 1000;
// Iran has used a fixed UTC+03:30 offset since 2022, so no daylight-saving handling is needed.
const TEHRAN_OFFSET_MS = (3 * 60 + 30) * 60 * 1000;

export const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const WEEKDAYS_BY_UTC_INDEX = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

export const CALENDAR_WEEKDAY_HEADERS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export interface JalaliDate {
  year: number;
  month: number;
  day: number;
}

interface GregorianParts {
  year: number;
  month: number;
  day: number;
}

const pad = (value: number) => String(value).padStart(2, '0');

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

export function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

export function tehranParts(date: Date) {
  const shifted = new Date(date.getTime() + TEHRAN_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

export function formatDayKey({ year, month, day }: GregorianParts): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function parseDayKey(key: string): GregorianParts {
  const [year, month, day] = key.split('-').map(Number);
  return { year, month, day };
}

export function dayKeyOf(date: Date): string {
  const { year, month, day } = tehranParts(date);
  return formatDayKey({ year, month, day });
}

export function addDaysToKey(key: string, days: number): string {
  const { year, month, day } = parseDayKey(key);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return formatDayKey({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
}

export function instantOf(key: string, hour: number): Date {
  const { year, month, day } = parseDayKey(key);
  return new Date(Date.UTC(year, month - 1, day, hour) - TEHRAN_OFFSET_MS);
}

export function utcWeekdayOfKey(key: string): number {
  const { year, month, day } = parseDayKey(key);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function weekdayOfKey(key: string): string {
  return WEEKDAYS_BY_UTC_INDEX[utcWeekdayOfKey(key)];
}

const jalaliFormatter = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

export function jalaliOfKey(key: string): JalaliDate {
  const { year, month, day } = parseDayKey(key);
  const parts = jalaliFormatter.formatToParts(new Date(Date.UTC(year, month - 1, day, 12)));
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: read('year'), month: read('month'), day: read('day') };
}

export function keyFromJalali({ year, month, day }: JalaliDate): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const monthOffset = month <= 6 ? (month - 1) * 31 : 186 + (month - 7) * 30;
  let cursor = Date.UTC(year + 621, 2, 21) + (monthOffset + day - 1) * DAY_MS;
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = new Date(cursor);
    const key = formatDayKey({
      year: candidate.getUTCFullYear(),
      month: candidate.getUTCMonth() + 1,
      day: candidate.getUTCDate(),
    });
    const found = jalaliOfKey(key);
    if (found.year === year && found.month === month && found.day === day) return key;
    const diff = (found.year - year) * 372 + (found.month - month) * 31 + (found.day - day);
    cursor -= (diff > 0 ? 1 : -1) * DAY_MS;
  }
  return null;
}

export function daysInJalaliMonth(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return keyFromJalali({ year, month: 12, day: 30 }) ? 30 : 29;
}

export function formatTime(date: Date): string {
  const { hour, minute } = tehranParts(date);
  return toPersianDigits(`${pad(hour)}:${pad(minute)}`);
}

export function formatJalaliLong(key: string): string {
  const j = jalaliOfKey(key);
  return `${weekdayOfKey(key)} ${toPersianDigits(j.day)} ${PERSIAN_MONTHS[j.month - 1]} ${toPersianDigits(j.year)}`;
}

export function formatJalaliShort(key: string): string {
  const j = jalaliOfKey(key);
  return `${toPersianDigits(j.day)} ${PERSIAN_MONTHS[j.month - 1]} ${toPersianDigits(j.year)}`;
}

export function formatJalaliInput(key: string): string {
  const j = jalaliOfKey(key);
  return toPersianDigits(`${j.year}/${pad(j.month)}/${pad(j.day)}`);
}

export function formatPersianDateTime(iso: string): string {
  const date = new Date(iso);
  return `${formatJalaliShort(dayKeyOf(date))}، ${formatTime(date)}`;
}
