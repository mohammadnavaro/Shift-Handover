export type TaskCategoryKey =
  | 'snapshot'
  | 'migration'
  | 'power'
  | 'configuration'
  | 'access'
  | 'creation'
  | 'deletion'
  | 'storage'
  | 'maintenance'
  | 'other';

export const TASK_CATEGORY_LABELS: Record<TaskCategoryKey, string> = {
  snapshot: 'اسنپ‌شات',
  migration: 'انتقال ماشین مجازی',
  power: 'روشن و خاموش',
  configuration: 'پیکربندی',
  access: 'دسترسی',
  creation: 'ایجاد',
  deletion: 'حذف',
  storage: 'فضای ذخیره‌سازی',
  maintenance: 'نگهداری میزبان',
  other: 'سایر',
};

export function taskCategoryOf(operation: string): TaskCategoryKey {
  const op = operation.trim().toLowerCase();
  if (op.startsWith('snapshot')) return 'snapshot';
  if (op.includes('migrat') || op.includes('vmotion') || op.includes('relocate')) return 'migration';
  if (op.startsWith('power')) return 'power';
  if (op.startsWith('reconfigur')) return 'configuration';
  if (op.startsWith('permission') || op.startsWith('role')) return 'access';
  if (op.startsWith('create') || op.startsWith('clone') || op.startsWith('deploy')) return 'creation';
  if (op.startsWith('delete') || op.startsWith('remove') || op.startsWith('destroy')) return 'deletion';
  if (op.startsWith('expand') || op.startsWith('datastore')) return 'storage';
  if (op.startsWith('maintenance') || op.startsWith('host')) return 'maintenance';
  return 'other';
}

export interface CategoryGroup<T> {
  key: TaskCategoryKey;
  label: string;
  items: T[];
}

export function groupByCategory<T extends { operation: string }>(items: T[]): CategoryGroup<T>[] {
  const groups = new Map<TaskCategoryKey, CategoryGroup<T>>();
  for (const item of items) {
    const key = taskCategoryOf(item.operation);
    const group = groups.get(key);
    if (group) group.items.push(item);
    else groups.set(key, { key, label: TASK_CATEGORY_LABELS[key], items: [item] });
  }
  return [...groups.values()];
}
