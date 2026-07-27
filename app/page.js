'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Card from '@/components/Card';
import Icon from '@/components/Icon';
import useStoredState from '@/components/useStoredState';

const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

export default function HomePage() {
  const [name,setName]=useState('there');
  useEffect(()=>{try{setName(JSON.parse(localStorage.getItem('wc-profile')||'{}').name||'there')}catch{}},[]);
  const [meals] = useStoredState('wc-meals', {});
  const [activity] = useStoredState('wc-activity', {});
  const [bloodWork] = useStoredState('wc-blood-v2', []);
  const [checkin] = useStoredState('wc-checkin', {});
  const logged = Object.values(meals).filter(Boolean).length;
  const latestBlood = bloodWork[0];
  const checkedInToday = checkin._date === new Date().toISOString().slice(0,10);
  const cards = [
    { href: '/meals', title: "Today's meals", value: `${logged} of 4 logged`, detail: logged ? 'You are making steady progress' : 'Start with your first meal', icon: 'meals', tone: 'bg-gold-light text-gold' },
    { href: '/activity', title: 'Energy level', value: activity.energy || 'Not checked', detail: activity.energy ? 'Updated today' : 'How are you feeling?', icon: 'energy', tone: 'bg-teal-light text-teal-dark' },
    { href: '/blood-work', title: 'Blood work', value: latestBlood ? `${latestBlood.labs?.length || 0} values` : 'No results yet', detail: latestBlood ? `Latest: ${new Date(`${latestBlood.date}T12:00`).toLocaleDateString('en-US',{month:'short',day:'numeric'})}` : 'Add or scan a result', icon: 'blood', tone: 'bg-clay-light text-clay' },
    { href: '/symptoms', title: 'Daily check-in', value: checkedInToday ? 'Completed' : 'Not completed', detail: checkedInToday ? 'Saved for today' : 'Log how you feel', icon: 'clipboard', tone: 'bg-[#EEE8F5] text-[#6B4D88]' },
  ];
  return (
    <div className="px-5 pb-5 pt-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="eyebrow">{today}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Good morning, {name}</h1>
          <p className="mt-2 text-base text-inkSoft">Here is your wellness plan for today.</p>
        </div>
        <button onClick={()=>window.dispatchEvent(new Event('wc-edit-profile'))} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal text-base font-bold uppercase text-white" aria-label="Edit profile">{name.slice(0,2)}</button>
      </header>

      <Card className="relative mt-7 overflow-hidden border-0 bg-teal p-6 text-white">
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <p className="text-sm font-bold uppercase tracking-widest text-teal-light">Today&apos;s focus</p>
        <h2 className="mt-2 font-display text-2xl font-bold">{activity.plan ? activity.plan.title : 'Build your day'}</h2>
        <p className="mt-2 max-w-[17rem] text-base leading-relaxed text-white/85">{activity.plan ? `${activity.plan.duration}${activity.done?' · Completed':' · Not completed yet'}` : 'Add a movement plan when you are ready.'}</p>
        <Link href="/activity" className="mt-5 inline-flex min-h-touch items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-teal-dark">{activity.plan?'View today’s plan':'Add a plan'} <Icon name="chevron" size={18}/></Link>
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
