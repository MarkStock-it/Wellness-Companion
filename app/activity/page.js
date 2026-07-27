'use client';
import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import BigButton from '@/components/BigButton';
import Icon from '@/components/Icon';
import useStoredState from '@/components/useStoredState';

export default function ActivityPage() {
  const [data, setData] = useStoredState('wc-activity', {});
  const [editing,setEditing]=useState(false);
  function savePlan(e){e.preventDefault();const form=new FormData(e.currentTarget);setData({...data,plan:{title:String(form.get('title')).trim(),duration:String(form.get('duration')).trim()},done:false});setEditing(false)}
  function toggleTask(id){setData({...data,tasks:data.tasks.map(task=>task.id===id?{...task,done:!task.done}:task)})}
  return <div className="px-5 pb-5"><PageHeader title="Activity" backHref="/" />
    <Card className="mt-4 overflow-hidden border-0 bg-teal p-6 text-white">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Icon name="activity" size={28}/></div>
      <p className="mt-5 text-sm font-bold uppercase tracking-widest text-teal-light">Today&apos;s movement</p>
      {data.plan?<><h2 className="mt-1 font-display text-2xl font-bold">{data.plan.title}</h2><p className="mt-2 text-base text-white/80">{data.plan.duration}</p><div className="mt-5"><BigButton variant={data.done ? 'secondary' : 'outline'} onClick={() => setData({...data, done: !data.done,completedDate:!data.done?new Date().toISOString().slice(0,10):null})}>{data.done ? <><Icon name="check"/> Completed today</> : 'Mark as complete'}</BigButton><button type="button" onClick={()=>setEditing(true)} className="mt-3 w-full py-2 text-sm font-bold text-white/80">Edit movement plan</button></div></>:<><h2 className="mt-1 font-display text-2xl font-bold">No movement planned</h2><p className="mt-2 text-base text-white/80">Add an activity that fits your day.</p><button type="button" onClick={()=>setEditing(true)} className="mt-5 min-h-touch w-full rounded-2xl bg-white px-4 font-bold text-teal-dark">Add movement plan</button></>}
    </Card>
    {data.tasksDate===new Date().toISOString().slice(0,10)&&data.tasks?.length>0&&<Card className="mt-4"><div className="flex items-end justify-between gap-3"><div><p className="eyebrow">Today</p><h2 className="mt-1 font-display text-xl font-bold">Planned activities</h2></div><p className="text-sm text-inkSoft">{data.tasks.filter(task=>task.done).length} of {data.tasks.length} done</p></div><div className="mt-4 space-y-3">{data.tasks.map(task=><button type="button" key={task.id} onClick={()=>toggleTask(task.id)} aria-pressed={task.done} className={`flex min-h-touch w-full items-center gap-3 rounded-2xl border p-3 text-left ${task.done?'border-teal/30 bg-teal-light':'border-line bg-canvas'}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${task.done?'border-teal bg-teal text-white':'border-line bg-surface text-inkSoft'}`}>{task.done?<Icon name="check" size={17}/>:null}</span><span className="min-w-0"><span className={`block font-bold ${task.done?'text-teal-dark':''}`}>{task.title}</span><span className="mt-1 block text-sm text-inkSoft">{task.duration}</span></span></button>)}</div></Card>}
    {editing&&<Card className="mt-4"><form onSubmit={savePlan} className="space-y-4"><label className="block"><span className="label">Activity</span><input className="field" name="title" defaultValue={data.plan?.title} placeholder="Example: Walk around the garden" required autoFocus/></label><label className="block"><span className="label">Duration or notes</span><input className="field" name="duration" defaultValue={data.plan?.duration} placeholder="Example: 10 minutes" required/></label><div className="flex gap-3"><BigButton type="button" variant="outline" onClick={()=>setEditing(false)}>Cancel</BigButton><BigButton type="submit">Save plan</BigButton></div></form></Card>}
    <Card className="mt-4">
      <h2 className="font-display text-xl font-bold">How is your energy?</h2><p className="mt-1 text-sm text-inkSoft">Choose the answer that feels closest.</p>
      <div className="mt-4 grid grid-cols-3 gap-2">{['Low','Okay','Good'].map((option, i) => <button key={option} onClick={() => setData({...data, energy: option})} aria-pressed={data.energy === option} className={`min-h-[76px] rounded-2xl border p-2 text-sm font-bold ${data.energy === option ? 'border-teal bg-teal text-white' : 'border-line bg-canvas'}`}><span className="mx-auto mb-2 block h-1.5 rounded-full bg-current" style={{width: `${20+i*10}px`}}/>{option}</button>)}</div>
      {data.energy && <p className="mt-4 flex items-center gap-2 rounded-xl bg-teal-light p-3 text-sm font-medium text-teal-dark"><Icon name="check" size={18}/> Energy saved for today</p>}
    </Card>
    <Card className="mt-4 flex gap-3 bg-gold-light/60"><Icon name="info" className="shrink-0 text-gold"/><p className="text-sm leading-relaxed text-inkSoft">Move gently and stop if you feel pain, dizziness, or shortness of breath.</p></Card>
  </div>;
}
