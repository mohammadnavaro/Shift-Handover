import { supabase } from '@/lib/supabase';
import type { ShiftKind } from '@/lib/shifts';

export interface ChangeEvent {
  id: string;
  occurred_at: string;
  user_name: string;
  operation: string;
  summary: string;
}

export interface ReasonVersion {
  id: string;
  event_id: string;
  body: string;
  author_email: string;
  created_at: string;
}

export interface ShiftClosure {
  day_key: string;
  kind: ShiftKind;
  closed_at: string;
  closed_by_email: string;
}

export async function fetchChangeLog(): Promise<{
  events: ChangeEvent[];
  reasons: ReasonVersion[];
  closures: ShiftClosure[];
}> {
  const [eventsResult, reasonsResult, closuresResult] = await Promise.all([
    supabase
      .from('vcenter_events')
      .select('id, occurred_at, user_name, operation, summary')
      .order('occurred_at', { ascending: true }),
    supabase
      .from('change_reasons')
      .select('id, event_id, body, author_email, created_at')
      .order('created_at', { ascending: true }),
    supabase
      .from('shift_closures')
      .select('day_key, kind, closed_at, closed_by_email'),
  ]);

  if (eventsResult.error) throw eventsResult.error;
  if (reasonsResult.error) throw reasonsResult.error;
  if (closuresResult.error) throw closuresResult.error;

  return {
    events: (eventsResult.data ?? []) as ChangeEvent[],
    reasons: (reasonsResult.data ?? []) as ReasonVersion[],
    closures: (closuresResult.data ?? []) as ShiftClosure[],
  };
}

export async function saveReason(eventId: string, body: string): Promise<void> {
  const { error } = await supabase.from('change_reasons').insert({ event_id: eventId, body });
  if (error) throw error;
}

export async function closeShift(dayKey: string, kind: ShiftKind): Promise<void> {
  const { error } = await supabase.from('shift_closures').insert({ day_key: dayKey, kind });
  if (error) throw error;
}
