import Link from 'next/link';
import Icon from './Icon';

export default function PageHeader({ title, backHref }) {
  return (
    <header className="sticky top-0 z-20 -mx-5 bg-canvas/90 px-5 pb-4 pt-5 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center gap-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Go back"
            className="icon-button -ml-2 text-teal-dark"
          >
            <Icon name="back" size={26} strokeWidth={2.5} />
          </Link>
        ) : null}
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
      </div>
    </header>
  );
}
