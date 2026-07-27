'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';

const items = [
  ['/', 'Home', 'home'], ['/meals', 'Meals', 'meals'],
  ['/blood-work', 'Blood', 'blood'], ['/activity', 'Activity', 'activity'],
  ['/more', 'More', 'more'],
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <ul className="mx-auto flex max-w-md px-2">
        {items.map(([href, label, icon]) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link href={href} aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-[70px] flex-col items-center justify-center gap-1 text-center ${active ? 'text-teal-dark' : 'text-inkSoft'}`}>
                {active && <span className="absolute top-0 h-1 w-8 rounded-b-full bg-teal" />}
                <Icon name={icon} size={23} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[12px] leading-none ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
