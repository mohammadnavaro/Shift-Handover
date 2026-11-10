import { invokeAdminFunction } from '@/lib/adminFunctions';
import { supabase } from '@/lib/supabase';

export interface AccountRecord {
  user_id: string;
  email: string;
  created_at: string;
  is_staff: boolean;
  is_admin: boolean;
  role: string | null;
}

export async function fetchAccounts(): Promise<AccountRecord[]> {
  const { data, error } = await supabase.rpc('admin_list_accounts');
  if (error) throw error;
  return (data ?? []) as AccountRecord[];
}

export async function setStaffAccess(userId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_set_staff', { target: userId, enabled });
  if (error) throw error;
}

export async function setAdminAccess(userId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_set_admin', { target: userId, enabled });
  if (error) throw error;
}

export async function setAccountRole(userId: string, role: string): Promise<void> {
  const { error } = await supabase.rpc('admin_set_role', { target: userId, new_role: role });
  if (error) throw error;
}

export async function createAccount(input: { email: string; password: string; role: string }): Promise<void> {
  await invokeAdminFunction('admin-users', { action: 'create', ...input });
}

export async function resetAccountPassword(userId: string, password: string): Promise<void> {
  await invokeAdminFunction('admin-users', { action: 'reset-password', user_id: userId, password });
}
