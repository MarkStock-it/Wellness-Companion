import Link from 'next/link';
import Card from '@/components/Card';

// TODO: replace with the signed-in patient's real name.
const PATIENT_NAME = 'Dolores';

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

// Placeholder summary data — TODO: connect each card to its real data source.
const SUMMARY_CARDS = [
  {
    href: '/meals',
    title: "Today's Meals",
    value: '2 of 4 logged',
    detail: 'Breakfast & lunch logged',
    icon: '🍽️',
  },
  {
    href: '/activity',
    title: 'Energy Level',
    value: 'Okay',
    detail: 'Last check-in: this morning',
    icon: '🔋',
  },
  {
    href: '/blood-work',
    title: 'Next Blood Test',
    value: 'Aug 4',
    detail: 'In 8 days, at 9:00 AM',
    icon: '🩸',
  },
  {
    href: '/more',
    title: 'Reminders',
    value: '2 today',
    detail: 'Take afternoon medication',
    icon: '⏰',
  },
];

export default function HomePage() {
  return (
    <div className="px-5 pt-8">
      <p className="text-xl text-inkSoft">Good morning,</p>
      <h1 className="font-display text-3xl font-bold text-ink">{PATIENT_NAME}</h1>
      <p className="mt-1 text-lg text-inkSoft">{today}</p>

      <h2 className="mt-8 mb-3 text-xl font-bold text-ink">Today at a glance</h2>

      <div className="flex flex-col gap-4">
        {SUMMARY_CARDS.map((item) => (
          <Link key={item.title} href={item.href} className="block">
            <Card className="flex min-h-touch items-center gap-4 active:opacity-80">
              <span aria-hidden="true" className="text-4xl">
                {item.icon}
              </span>
              <span className="flex-1">
                <span className="block text-lg font-bold text-ink">{item.title}</span>
                <span className="block text-xl font-bold text-teal-dark">{item.value}</span>
                <span className="block text-base text-inkSoft">{item.detail}</span>
              </span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-inkSoft shrink-0">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
