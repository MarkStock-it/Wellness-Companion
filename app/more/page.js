'use client';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Icon from '@/components/Icon';
const items=[
  ['/meal-ideas','Meal ideas','Simple, nourishing suggestions','bowl','bg-gold-light text-gold'],
  ['/symptoms','Daily check-in','Appetite, nausea, fatigue and mood','clipboard','bg-teal-light text-teal-dark'],
  ['/ai-summary','Health summary','A plain-language weekly overview','sparkle','bg-[#EEE8F5] text-[#6B4D88]'],
  ['/resources','Support resources','Guidance and professional support','phone','bg-clay-light text-clay'],
];
export default function MorePage(){return <div className="px-5 pb-5"><PageHeader title="More"/>
  <p className="mt-3 text-base text-inkSoft">Tools and support for your care journey.</p>
  <div className="mt-5 space-y-3">{items.map(([href,title,detail,icon,tone])=><Link key={href} href={href} className="block"><Card className="flex items-center gap-4 p-4 transition hover:-translate-y-0.5"><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone}`}><Icon name={icon}/></span><span className="flex-1"><strong className="block">{title}</strong><span className="block text-sm text-inkSoft">{detail}</span></span><Icon name="chevron" className="text-inkSoft"/></Card></Link>)}</div>
  <button className="mt-4 flex min-h-touch w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-sm font-bold text-teal-dark" onClick={()=>window.dispatchEvent(new Event('wc-edit-profile'))}><Icon name="user" size={20}/>Edit wellness profile</button>
  <p className="mt-7 text-center text-xs font-medium uppercase tracking-widest text-inkSoft">Wellness Companion · Version 1.0</p>
  </div>}
