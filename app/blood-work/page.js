'use client';
import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import BigButton from '@/components/BigButton';
import Modal from '@/components/Modal';
import Icon from '@/components/Icon';
import useStoredState from '@/components/useStoredState';
const seed=[{date:'2026-07-21',hemoglobin:12.4,wbc:5.8},{date:'2026-06-18',hemoglobin:12.1,wbc:6.2},{date:'2026-05-16',hemoglobin:12.6,wbc:5.5}];
function path(data,key){const vals=data.slice(0,6).reverse();if(vals.length<2)return'';const nums=vals.map(x=>Number(x[key]));const min=Math.min(...nums)-.5,max=Math.max(...nums)+.5;return nums.map((v,i)=>`${i?'L':'M'} ${i*280/(nums.length-1)+10} ${130-(v-min)/(max-min)*100}`).join(' ')}
export default function BloodWork(){
 const [results,setResults]=useStoredState('wc-blood',seed);const [open,setOpen]=useState(false);const latest=results[0]||seed[0];
 function add(e){e.preventDefault();const f=new FormData(e.currentTarget);const result={date:f.get('date'),hemoglobin:Number(f.get('hemoglobin')),wbc:Number(f.get('wbc'))};setResults([result,...results].sort((a,b)=>b.date.localeCompare(a.date)));setOpen(false)}
 return <div className="px-5 pb-5"><PageHeader title="Blood work" backHref="/"/>
  <Card className="mt-4"><div className="flex items-start justify-between"><div><p className="eyebrow">Latest results</p><h2 className="mt-1 font-display text-2xl font-bold">Your trends</h2></div><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-clay-light text-clay"><Icon name="trend"/></span></div>
   <svg viewBox="0 0 300 145" className="mt-5 w-full" role="img" aria-label="Blood result trend chart"><path d="M10 30H290M10 80H290M10 130H290" stroke="#E4DACB" strokeWidth="1"/><path d={path(results,'hemoglobin')} fill="none" stroke="#116466" strokeWidth="4" strokeLinecap="round"/><path d={path(results,'wbc')} fill="none" stroke="#B5563C" strokeWidth="4" strokeLinecap="round" strokeDasharray="3 7"/></svg>
   <div className="flex gap-4 text-xs font-bold"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-teal"/>Hemoglobin</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-clay"/>White cells</span></div>
  </Card>
  <Card className="mt-4"><div className="flex justify-between"><h2 className="font-display text-xl font-bold">Most recent</h2><time className="text-sm text-inkSoft">{new Date(`${latest.date}T12:00`).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</time></div>
   <dl className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-teal-light p-4"><dt className="text-xs font-bold uppercase tracking-wide text-inkSoft">Hemoglobin</dt><dd className="mt-1 text-xl font-bold text-teal-dark">{latest.hemoglobin} <small className="text-xs">g/dL</small></dd></div><div className="rounded-2xl bg-clay-light p-4"><dt className="text-xs font-bold uppercase tracking-wide text-inkSoft">White cells</dt><dd className="mt-1 text-xl font-bold text-clay">{latest.wbc} <small className="text-xs">×10⁹/L</small></dd></div></dl>
  </Card>
  <BigButton className="mt-5" onClick={()=>setOpen(true)}><Icon name="plus"/>Add new result</BigButton>
  <Modal open={open} title="Add blood result" onClose={()=>setOpen(false)}><form className="mt-5 space-y-4" onSubmit={add}><label className="block"><span className="label">Test date</span><input className="field" type="date" name="date" required defaultValue={new Date().toISOString().slice(0,10)}/></label><label className="block"><span className="label">Hemoglobin (g/dL)</span><input className="field" type="number" step=".1" min="1" max="30" name="hemoglobin" required/></label><label className="block"><span className="label">White cells (×10⁹/L)</span><input className="field" type="number" step=".1" min=".1" max="100" name="wbc" required/></label><BigButton type="submit">Save result</BigButton></form></Modal>
 </div>
}
