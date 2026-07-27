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
}) {
  const base =
    'min-h-touch inline-flex items-center justify-center gap-2 rounded-card px-6 py-4 text-lg font-bold transition-none active:opacity-80';

  const variants = {
    primary: 'bg-teal text-white',
    secondary: 'bg-gold-light text-ink border-2 border-gold',
    outline: 'bg-surface text-teal-dark border-2 border-teal',
  };

  return (
    <button
      type={type}
      onClick={
        onClick ||
        (() => {
          // TODO: wire up real behavior when this feature is implemented.
          console.log('Dummy button pressed — no functionality in this wireframe.');
        })
      }
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </button>
  );
}
