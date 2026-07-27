import Link from 'next/link';

export default function PageHeader({ title, backHref }) {
  return (
    <header className="sticky top-0 z-20 bg-canvas/95 backdrop-blur-sm border-b-2 border-line px-5 pt-6 pb-4">
      <div className="mx-auto flex max-w-md items-center gap-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Go back"
            className="flex min-h-touch min-w-touch items-center justify-center rounded-card text-teal-dark"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
        ) : null}
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
      </div>
    </header>
  );
}
