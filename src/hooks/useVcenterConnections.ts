import { useCallback, useEffect, useState } from 'react';
import { fetchVcenterConnections, type VcenterConnection } from '@/lib/vcenter';

export function useVcenterConnections() {
  const [connections, setConnections] = useState<VcenterConnection[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const reload = useCallback(async () => {
    try {
      setConnections(await fetchVcenterConnections());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { connections, status, reload };
}
