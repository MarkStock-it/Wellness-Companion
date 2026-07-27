'use client';
import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Icon from '@/components/Icon';
const ideas=[
  ['Scrambled eggs & toast','High protein','10 min'],['Chicken & rice soup','Easy to digest','25 min'],['Banana oat smoothie','Low appetite','5 min'],['Baked salmon & mash','High protein','30 min'],['Yogurt & peaches','Easy to digest','5 min'],['Peanut butter toast','High calorie','5 min']
];
export default function MealIdeas(){const [query,setQuery]=useState('');const [filter,setFilter]=useState('All');const tags=['All','High protein','Easy to digest'];const visible=ideas.filter(x=>(filter==='All'||x[1]===filter)&&x[0].toLowerCase().includes(query.toLowerCase()));return <div className="px-5 pb-5"><PageHeader title="Meal ideas" backHref="/more"/>
  <div className="relative mt-4"><Icon name="search" size={20} className="absolute left-4 top-4 text-inkSoft"/><input className="field pl-12" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search meal ideas" aria-label="Search meal ideas"/></div>
  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{tags.map(t=><button key={t} onClick={()=>setFilter(t)} className={`min-h-touch shrink-0 rounded-full px-4 text-sm font-bold ${filter===t?'bg-teal text-white':'border border-line bg-surface text-inkSoft'}`}>{t}</button>)}</div>
  <div className="mt-5 space-y-3">{visible.map(([title,tag,time],i)=><Card key={title} className="flex gap-4 p-4"><span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${i%2?'bg-teal-light text-teal':'bg-gold-light text-gold'}`}><Icon name="bowl" size={30}/></span><div className="min-w-0"><h2 className="font-bold leading-snug">{title}</h2><p className="mt-1 text-xs font-bold uppercase tracking-wide text-teal-dark">{tag}</p><p className="mt-2 text-sm text-inkSoft">{time} preparation</p></div></Card>)}</div>{!visible.length&&<p className="py-12 text-center text-inkSoft">No meal ideas match your search.</p>}
  </div>}
