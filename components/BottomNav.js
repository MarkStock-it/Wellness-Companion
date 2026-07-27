'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Fixed, consistent bottom navigation — appears identically on every screen
// so users never have to relearn where things are. Max 5 items per the
// elderly-friendly design brief. Any screen not in this list (Meal Ideas,
// Symptom Check-in, AI Summary, Resources) is reached through "More".
const NAV_ITEMS = [
  {
    href: '/',
    label: 'Home',
    icon: (active) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
      </svg>
    ),
  },
  {
    href: '/meals',
    label: 'Meals',
    icon: (active) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3v7a2 2 0 0 0 2 2v9" />
        <path d="M10 3v7" />
        <path d="M6 3v7" />
        <path d="M18 3c-1.5 0-3 1.8-3 5.5S16.5 13 18 13v8" />
      </svg>
    ),
  },
  {
    href: '/blood-work',
    label: 'Blood Work',
    icon: (active) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l5-6 4 4 5-7 4 5" />
        <path d="M3 20h18" />
      </svg>
    ),
  },
  {
    href: '/activity',
    label: 'Activity',
    icon: (active) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="4.5" r="2" />
        <path d="M7 21l3-6 2 2 2-2 3 6" />
        <path d="M10 15l-2-5 4-2 2 3 3-1" />
      </svg>
    ),
  },
  {
    href: '/more',
    label: 'More',
    icon: (active) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t-2 border-line"
    >
      <ul className="mx-auto flex max-w-md">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-touch flex-col items-center justify-center gap-1 py-2 text-center transition-none
                  ${active ? 'text-teal-dark' : 'text-inkSoft'}`}
              >
                {item.icon(active)}
                <span className={`text-[15px] leading-tight ${active ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
