import { invokeAdminFunction } from '@/lib/adminFunctions';
import { supabase } from '@/lib/supabase';

export interface VcenterConnection {
  id: string;
  name: string;
  host: string;
  username: string;
  last_checked_at: string | null;
  last_status: 'ok' | 'error' | null;
  last_message: string | null;
  created_at: string;
}

export interface VcenterCheckResult {
  status: 'ok' | 'error';
  message: string;
}

const CONNECTION_COLUMNS = 'id, name, host, username, last_checked_at, last_status, last_message, created_at';

export async function fetchVcenterConnections(): Promise<VcenterConnection[]> {
  const { data, error } = await supabase
    .from('vcenter_connections')
    .select(CONNECTION_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as VcenterConnection[];
}

export async function saveVcenterConnection(input: {
  name: string;
  host: string;
  username: string;
  password: string;
}): Promise<void> {
  await invokeAdminFunction('vcenter-connection', { action: 'save', ...input });
}

export async function checkVcenterConnection(id: string): Promise<VcenterCheckResult> {
  return invokeAdminFunction<VcenterCheckResult>('vcenter-connection', { action: 'check', id });
}
