import Link from 'next/link';
import Icon from '@/components/Icon';

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-teal-light text-teal-dark">
        <Icon name="heart" size={38} />
      </span>
      <p className="eyebrow mt-6">You are offline</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Your saved data is still here</h1>
      <p className="mt-3 max-w-sm text-base leading-relaxed text-inkSoft">
        Previously opened wellness tools remain available. AI features need an internet connection.
      </p>
      <Link href="/" className="mt-6 inline-flex min-h-touch items-center rounded-2xl bg-teal px-6 font-bold text-white">
        Return home
      </Link>
    </div>
  );
}
