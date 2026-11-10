import { useCallback, useEffect, useState } from 'react';
import { fetchChangeLog, type ChangeEvent, type ReasonVersion } from '@/lib/changeLog';

const REFRESH_INTERVAL_MS = 60_000;

export function useChangeLog() {
  const [events, setEvents] = useState<ChangeEvent[]>([]);
  const [reasons, setReasons] = useState<ReasonVersion[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const reload = useCallback(async () => {
    try {
      const result = await fetchChangeLog();
      setEvents(result.events);
      setReasons(result.reasons);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [reload]);

  return { events, reasons, status, reload };
}
