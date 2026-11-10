import { useCallback, useEffect, useState } from 'react';
import { fetchAccounts, type AccountRecord } from '@/lib/accounts';

export function useAccounts() {
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const reload = useCallback(async () => {
    try {
      setAccounts(await fetchAccounts());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { accounts, status, reload };
}
