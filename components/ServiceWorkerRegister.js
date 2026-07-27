'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    navigator.serviceWorker.register(`${basePath}/sw.js`, { scope: `${basePath}/` }).catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  }, []);
  return null;
}
