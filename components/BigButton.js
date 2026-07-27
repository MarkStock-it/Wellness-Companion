'use client';

// A single, consistent "big button" used everywhere in the app so tap
// targets and styling never vary from screen to screen.
// variant: 'primary' | 'secondary' | 'outline'
export default function BigButton({
  children,
  onClick,
  variant = 'primary',
  fullWidth = true,
  type = 'button',
  disabled = false,
  className = '',
}) {
  const base =
    'min-h-touch inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-base font-bold transition active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50';

  const variants = {
    primary: 'bg-teal text-white shadow-[0_8px_20px_rgba(17,100,102,.18)] hover:bg-teal-dark',
    secondary: 'bg-gold-light text-ink border border-gold/30 hover:border-gold',
    outline: 'bg-surface text-teal-dark border border-teal/40 hover:bg-teal-light',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
