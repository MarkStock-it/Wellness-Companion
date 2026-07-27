'use client';

import { useEffect } from 'react';
import Icon from './Icon';

export default function Modal({ open, title, onClose, children, className = '' }) {
  useEffect(() => {
    if (!open) return;
    const close = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 sm:items-center" role="presentation" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="dialog-title" className={`max-h-[92vh] w-full max-w-md overflow-auto rounded-[28px] bg-surface p-5 shadow-2xl sm:p-7 ${className}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h2 id="dialog-title" className="font-display text-2xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="icon-button rotate-45"><Icon name="plus" /></button>
        </div>
        {children}
      </section>
    </div>
  );
}
