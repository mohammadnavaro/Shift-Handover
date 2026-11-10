import { supabase } from '@/lib/supabase';

export interface ChangeEvent {
  id: string;
  occurred_at: string;
  user_name: string;
  summary: string;
}

export interface ReasonVersion {
  id: string;
  event_id: string;
  body: string;
  author_email: string;
  created_at: string;
}

export async function fetchChangeLog(): Promise<{ events: ChangeEvent[]; reasons: ReasonVersion[] }> {
  const [eventsResult, reasonsResult] = await Promise.all([
    supabase
      .from('vcenter_events')
      .select('id, occurred_at, user_name, summary')
      .order('occurred_at', { ascending: true }),
    supabase
      .from('change_reasons')
      .select('id, event_id, body, author_email, created_at')
      .order('created_at', { ascending: true }),
  ]);

  if (eventsResult.error) throw eventsResult.error;
  if (reasonsResult.error) throw reasonsResult.error;

  return {
    events: (eventsResult.data ?? []) as ChangeEvent[],
    reasons: (reasonsResult.data ?? []) as ReasonVersion[],
  };
}

export async function saveReason(eventId: string, body: string): Promise<void> {
  const { error } = await supabase.from('change_reasons').insert({ event_id: eventId, body });
  if (error) throw error;
}
