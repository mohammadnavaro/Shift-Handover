import { useCallback, useEffect, useState } from 'react';
import { fetchRoles, type StaffRole } from '@/lib/roles';

export function useRoles() {
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const reload = useCallback(async () => {
    try {
      setRoles(await fetchRoles());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { roles, status, reload };
}
