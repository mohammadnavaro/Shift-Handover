import { supabase } from '@/lib/supabase';

export interface StaffRole {
  name: string;
  label: string;
  can_write_reasons: boolean;
}

export async function fetchRoles(): Promise<StaffRole[]> {
  const { data, error } = await supabase
    .from('staff_roles')
    .select('name, label, can_write_reasons')
    .order('name');
  if (error) throw error;
  return (data ?? []) as StaffRole[];
}

export async function upsertRole(role: StaffRole): Promise<void> {
  const { error } = await supabase.rpc('admin_upsert_role', {
    role_name: role.name,
    role_label: role.label,
    writes_reasons: role.can_write_reasons,
  });
  if (error) throw error;
}
