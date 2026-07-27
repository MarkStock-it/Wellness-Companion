'use client';
import Link from 'next/link';
import Card from '@/components/Card';
import Icon from '@/components/Icon';
import useStoredState from '@/components/useStoredState';

const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

export default function HomePage() {
  const [meals] = useStoredState('wc-meals', {});
  const [activity] = useStoredState('wc-activity', {});
  const logged = Object.values(meals).filter(Boolean).length;
  const cards = [
    { href: '/meals', title: "Today's meals", value: `${logged} of 4 logged`, detail: logged ? 'You are making steady progress' : 'Start with your first meal', icon: 'meals', tone: 'bg-gold-light text-gold' },
    { href: '/activity', title: 'Energy level', value: activity.energy || 'Not checked', detail: activity.energy ? 'Updated today' : 'How are you feeling?', icon: 'energy', tone: 'bg-teal-light text-teal-dark' },
    { href: '/blood-work', title: 'Next blood test', value: 'August 4', detail: '8 days away · 9:00 AM', icon: 'calendar', tone: 'bg-clay-light text-clay' },
    { href: '/more', title: 'Reminders', value: '2 for today', detail: 'Next: afternoon medication', icon: 'bell', tone: 'bg-[#EEE8F5] text-[#6B4D88]' },
  ];
  return (
    <div className="px-5 pb-5 pt-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="eyebrow">{today}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Good morning, Dolores</h1>
          <p className="mt-2 text-base text-inkSoft">Here is your wellness plan for today.</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal text-base font-bold text-white" aria-label="Dolores profile">DS</div>
      </header>

      <Card className="relative mt-7 overflow-hidden border-0 bg-teal p-6 text-white">
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <p className="text-sm font-bold uppercase tracking-widest text-teal-light">Today&apos;s focus</p>
        <h2 className="mt-2 font-display text-2xl font-bold">Small steps count</h2>
        <p className="mt-2 max-w-[17rem] text-base leading-relaxed text-white/85">Log your meals and take a few minutes for gentle movement.</p>
        <Link href="/activity" className="mt-5 inline-flex min-h-touch items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-teal-dark">View today&apos;s plan <Icon name="chevron" size={18}/></Link>
      </Card>

      <div className="mb-3 mt-8 flex items-end justify-between">
        <h2 className="font-display text-2xl font-bold">At a glance</h2>
        <span className="text-sm font-medium text-inkSoft">Today</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((item) => (
          <Link key={item.title} href={item.href}>
            <Card className="h-full min-h-[190px] p-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}><Icon name={item.icon} /></span>
              <span className="mt-4 block text-sm font-semibold text-inkSoft">{item.title}</span>
              <span className="mt-1 block text-lg font-bold leading-tight">{item.value}</span>
              <span className="mt-2 block text-sm leading-snug text-inkSoft">{item.detail}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
