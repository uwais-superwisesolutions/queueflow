import { useEffect, useRef } from 'react';

/**
 * Polls a callback on a fixed interval. Stops on unmount. The latest version
 * of `fn` is always called, even if the caller passes a fresh closure each
 * render — so view code can read up-to-date state without re-arming the timer.
 *
 * Phase 2: when we swap to Supabase Realtime subscriptions per
 * REALTIME_CHANNELS.md, every call site of `usePolling` becomes a call site
 * of `useRealtimeChannel` — same shape, one place to edit.
 */
export function usePolling(fn: () => void | Promise<void>, intervalMs: number) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!intervalMs || intervalMs <= 0) return;
    const id = window.setInterval(() => {
      void fnRef.current();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
}
