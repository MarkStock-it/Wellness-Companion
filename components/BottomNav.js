'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from './Icon';

const items = [
  ['/', 'Home', 'home'], ['/meals', 'Meals', 'meals'],
  ['/blood-work', 'Blood', 'blood'], ['/activity', 'Activity', 'activity'],
  ['/more', 'More', 'more'],
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const holdTimer = useRef(null);
  const holdTriggered = useRef(false);
  const [holdingBlood, setHoldingBlood] = useState(false);
  function startBloodHold(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    holdTriggered.current = false;
    setHoldingBlood(true);
    holdTimer.current = window.setTimeout(() => {
      holdTriggered.current = true;
      setHoldingBlood(false);
      localStorage.setItem('wc-blood-long-press-used', 'true');
      if (navigator.vibrate) navigator.vibrate(35);
      router.push('/blood-work/scanner');
    }, 550);
  }
  function finishBloodHold() {
    window.clearTimeout(holdTimer.current);
    setHoldingBlood(false);
    if (!holdTriggered.current) router.push('/blood-work');
  }
  function cancelBloodHold() {
    window.clearTimeout(holdTimer.current);
    setHoldingBlood(false);
  }
  return (
    <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <ul className="mx-auto flex max-w-md px-2">
        {items.map(([href, label, icon]) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          if (href === '/blood-work') return (
            <li key={href} className="flex-1">
              <button type="button" aria-current={active ? 'page' : undefined} aria-label="Blood. Tap for trends, hold for scanner"
                onPointerDown={startBloodHold} onPointerUp={finishBloodHold} onPointerCancel={cancelBloodHold}
                onPointerLeave={event=>{if(event.pointerType==='mouse')cancelBloodHold()}}
                onContextMenu={event=>event.preventDefault()}
                className={`relative flex min-h-[70px] w-full touch-none select-none flex-col items-center justify-center gap-1 text-center ${active ? 'text-teal-dark' : 'text-inkSoft'}`}>
                {active && <span className="absolute top-0 h-1 w-8 rounded-b-full bg-teal" />}
                <span className={`rounded-full p-1 transition duration-300 ${holdingBlood?'scale-110 bg-teal-light text-teal-dark':''}`}><Icon name={icon} size={23} strokeWidth={active ? 2.5 : 2} /></span>
                <span className={`text-[12px] leading-none ${active ? 'font-bold' : 'font-medium'}`}>{holdingBlood?'Keep holding…':label}</span>
              </button>
            </li>
          );
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
