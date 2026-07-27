'use client';
import { useEffect, useState } from 'react';

export default function useStoredState(key, fallback) {
  const [value, setValue] = useState(fallback);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    function load() { try {
      const stored = window.localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored));
    } catch {} }
    load();
    const refresh = event => { if (!event.detail?.key || event.detail.key === key) load(); };
    window.addEventListener('wc-storage-updated', refresh);
    setReady(true);
    return () => window.removeEventListener('wc-storage-updated', refresh);
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, ready, value]);
  return [value, setValue, ready];
}
