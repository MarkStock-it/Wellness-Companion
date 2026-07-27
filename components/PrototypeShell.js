'use client';
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import BigButton from './BigButton';
import Modal from './Modal';
import { callAi, getAiSettings } from '@/lib/aiClient';

const welcome = { role: 'assistant', text: 'Hi. I can help you understand patterns in your wellness log. What would you like to know?' };

function createLocalId() {
  const browserCrypto = globalThis.crypto;
  if (typeof browserCrypto?.randomUUID === 'function') return browserCrypto.randomUUID();
  if (typeof browserCrypto?.getRandomValues === 'function') {
    const bytes = browserCrypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0'));
    return `${hex.slice(0,4).join('')}-${hex.slice(4,6).join('')}-${hex.slice(6,8).join('')}-${hex.slice(8,10).join('')}-${hex.slice(10).join('')}`;
  }
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,12)}`;
}

const profileSteps = [
  { title: 'Basic information', short: 'Basics', description: 'Tell us a little about yourself.' },
  { title: 'Date of birth', short: 'Birthday', description: 'Choose your date of birth from the calendar.' },
  { title: 'Health information', short: 'Health', description: 'Add context that can personalize your experience.' },
  { title: 'Lifestyle & goals', short: 'Lifestyle', description: 'Share what you would like to work toward.' },
  { title: 'Review & finish', short: 'Review', description: 'Make sure everything looks right.' },
];

function initialProfile(value) {
  let draft = {};
  try { if (typeof window !== 'undefined') draft = JSON.parse(localStorage.getItem('wc-profile-draft') || '{}'); } catch {}
  const oldName = (value.name || '').trim().split(/\s+/);
  return {
    firstName: value.firstName || oldName[0] || '', middleName: value.middleName || '',
    lastName: value.lastName || oldName.slice(1).join(' '), username: value.username || '',
    dateOfBirth: value.dateOfBirth || '', gender: value.gender || '',
    height: value.height || '', weight: value.weight || '',
    conditions: value.conditions || value.condition || '', allergies: value.allergies || value.dietary || '',
    medications: value.medications || '', treatment: value.treatment || '',
    otherHealth: value.otherHealth || '', activityLevel: value.activityLevel || '',
    goals: value.goals || '', preferences: value.preferences || '',
    localId: value.localId || '', ...draft,
  };
}

function Field({ label, children, optional = false, className = '' }) {
  return <label className={`block ${className}`}><span className="label">{label}{optional && <span className="ml-1 normal-case tracking-normal text-inkSoft/70">(optional)</span>}</span>{children}</label>;
}

function DatePicker({ value, onChange, error, inline = false }) {
  const selected = value ? new Date(`${value}T12:00:00`) : null;
  const [open,setOpen]=useState(inline);
  const [view,setView]=useState(()=>selected || new Date());
  const today=new Date();today.setHours(23,59,59,999);
  const year=view.getFullYear(),month=view.getMonth();
  const monthNames=Array.from({length:12},(_,i)=>new Date(2000,i,1).toLocaleDateString('en-US',{month:'long'}));
  const years=Array.from({length:121},(_,i)=>today.getFullYear()-i);
  const start=new Date(year,month,1);const offset=start.getDay();
  const days=new Date(year,month+1,0).getDate();
  const cells=Array.from({length:42},(_,i)=>{const day=i-offset+1;return new Date(year,month,day)});
  const format=(date)=>date.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  function choose(date){const local=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;onChange({target:{name:'dateOfBirth',value:local}});if(!inline)setOpen(false)}
  return <div className={inline?'':'relative'}>
    {!inline&&<button type="button" onClick={()=>setOpen(!open)} aria-expanded={open} aria-haspopup="dialog" className={`field flex items-center justify-between text-left ${error?'border-clay':''}`}>
      <span className={selected?'text-ink':'text-inkSoft'}>{selected?format(selected):'Choose a date'}</span><Icon name="calendar" size={20} className="shrink-0 text-teal-dark"/>
    </button>}
    {open&&<div role={inline?'group':'dialog'} aria-label="Choose date of birth" className={`${inline?'mx-auto w-full max-w-md bg-canvas/60':'absolute left-0 top-[calc(100%+.5rem)] z-50 w-[min(22rem,calc(100vw-3rem))] bg-surface shadow-2xl'} rounded-[22px] border border-line p-4`}>
      <div className="flex items-center justify-between gap-1">
        <button type="button" className="icon-button shrink-0" aria-label="Previous month" onClick={()=>setView(new Date(year,month-1,1))}><Icon name="back" size={20}/></button>
        <div className="flex min-w-0 flex-1 justify-center gap-2">
          <label className="sr-only" htmlFor="birth-month">Month</label>
          <select id="birth-month" className="calendar-select min-w-0 flex-1" value={month} onChange={e=>setView(new Date(year,Number(e.target.value),1))}>
            {monthNames.map((name,i)=><option key={name} value={i}>{name}</option>)}
          </select>
          <label className="sr-only" htmlFor="birth-year">Year</label>
          <select id="birth-year" className="calendar-select w-[5.6rem]" value={year} onChange={e=>setView(new Date(Number(e.target.value),month,1))}>
            {years.map(item=><option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <button type="button" className="icon-button shrink-0" aria-label="Next month" onClick={()=>setView(new Date(year,month+1,1))}><Icon name="chevron" size={20}/></button>
      </div>
      <div className="mt-2 grid grid-cols-7 text-center">{['S','M','T','W','T','F','S'].map((d,i)=><span key={`${d}-${i}`} className="py-2 text-xs font-bold text-inkSoft">{d}</span>)}
        {cells.map((date,i)=>{const inMonth=date.getMonth()===month;const disabled=date>today;const active=selected&&date.toDateString()===selected.toDateString();const isToday=date.toDateString()===new Date().toDateString();return <button type="button" key={i} disabled={disabled} onClick={()=>choose(date)} aria-label={format(date)} aria-pressed={active} className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${active?'bg-teal text-white':isToday?'bg-teal-light text-teal-dark':inMonth?'text-ink hover:bg-canvas':'text-inkSoft/40'} disabled:cursor-not-allowed disabled:opacity-25`}>{date.getDate()}</button>})}
      </div>
      <div className="mt-3 flex justify-end border-t border-line pt-3">{!inline&&<button type="button" className="mr-auto px-2 text-sm font-bold text-inkSoft" onClick={()=>setOpen(false)}>Cancel</button>}<button type="button" className="px-2 text-sm font-bold text-teal-dark" onClick={()=>setView(new Date())}>Today</button></div>
    </div>}
  </div>;
}

function ProfileForm({ initial = {}, onSave, onCancel }) {
  const [step,setStep]=useState(0); const [direction,setDirection]=useState('forward');
  const [data,setData]=useState(()=>initialProfile(initial)); const [errors,setErrors]=useState({});
  useEffect(()=>{localStorage.setItem('wc-profile-draft',JSON.stringify(data))},[data]);
  function update(e){setData({...data,[e.target.name]:e.target.value});setErrors({...errors,[e.target.name]:''})}
  function validate(index){
    const required=index===0?['firstName','lastName','username','gender']:index===1?['dateOfBirth']:index===2?['height','weight']:[];
    const next={}; required.forEach(key=>{if(!String(data[key]||'').trim())next[key]='Required'});
    if(index===1&&data.dateOfBirth&&new Date(data.dateOfBirth)>new Date())next.dateOfBirth='Use a valid date';
    if(index===0&&data.username&&data.username.trim().length<3)next.username='Use at least 3 characters';
    if(index===2&&data.height&&(Number(data.height)<80||Number(data.height)>250))next.height='Enter 80–250 cm';
    if(index===2&&data.weight&&(Number(data.weight)<20||Number(data.weight)>400))next.weight='Enter 20–400 kg';
    setErrors(next); return !Object.keys(next).length;
  }
  function go(next){if(next>step&&!validate(step))return;setDirection(next>step?'forward':'back');setStep(next)}
  function finish(){const result={...data,localId:data.localId||createLocalId(),name:`${data.firstName} ${data.lastName}`.trim()};localStorage.removeItem('wc-profile-draft');onSave(result)}
  const input=(name,props={})=><><input className={`field ${errors[name]?'border-clay':''}`} name={name} value={data[name]} onChange={update} {...props}/>{errors[name]&&<span className="mt-1 block text-xs font-bold text-clay">{errors[name]}</span>}</>;
  return <div className="mt-6">
    <div className="relative">
      <div className="absolute left-[10%] right-[10%] top-4 h-0.5 bg-line"><div className="h-full bg-teal transition-all duration-300" style={{width:`${step/4*100}%`}}/></div>
      <ol className="relative grid grid-cols-5">{profileSteps.map((item,i)=><li key={item.short} className="text-center"><button type="button" onClick={()=>i<step&&go(i)} disabled={i>step} className="group w-full disabled:cursor-default"><span className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors duration-300 ${i<step?'border-teal bg-teal text-white':i===step?'border-teal bg-surface text-teal-dark':'border-line bg-surface text-inkSoft'}`}>{i<step?<Icon name="check" size={15}/>:i+1}</span><span className={`mt-2 hidden text-[11px] font-bold sm:block ${i===step?'text-teal-dark':'text-inkSoft'}`}>{item.short}</span></button></li>)}</ol>
    </div>
    <div key={step} className={`mt-7 ${direction==='forward'?'step-enter-forward':'step-enter-back'}`}>
      <p className="eyebrow">Step {step+1} of 5</p><h3 className="mt-1 font-display text-2xl font-bold">{profileSteps[step].title}</h3><p className="mt-1 text-sm text-inkSoft">{profileSteps[step].description}</p>
      {step===0&&<div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="First name">{input('firstName',{autoFocus:true,autoComplete:'given-name'})}</Field>
        <Field label="Middle name" optional>{input('middleName',{autoComplete:'additional-name'})}</Field>
        <Field label="Last name">{input('lastName',{autoComplete:'family-name'})}</Field>
        <Field label="Username">{input('username',{autoComplete:'username',placeholder:'How you sign in'})}</Field>
        <Field label="Gender"><select className={`field ${errors.gender?'border-clay':''}`} name="gender" value={data.gender} onChange={update}><option value="">Select</option><option>Woman</option><option>Man</option><option>Non-binary</option><option>Prefer not to say</option></select>{errors.gender&&<span className="mt-1 block text-xs font-bold text-clay">{errors.gender}</span>}</Field>
      </div>}
      {step===1&&<div className="mt-6"><DatePicker value={data.dateOfBirth} onChange={update} error={errors.dateOfBirth} inline/>{data.dateOfBirth&&<p className="mt-4 text-center text-sm font-bold text-teal-dark">Selected: {new Date(`${data.dateOfBirth}T12:00:00`).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</p>}{errors.dateOfBirth&&<p className="mt-3 text-center text-sm font-bold text-clay">{errors.dateOfBirth}</p>}</div>}
      {step===2&&<div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Height (cm)">{input('height',{type:'number',min:80,max:250,inputMode:'decimal'})}</Field>
        <Field label="Weight (kg)">{input('weight',{type:'number',min:20,max:400,step:'.1',inputMode:'decimal'})}</Field>
        <Field label="Medical conditions" optional className="sm:col-span-2"><textarea className="field min-h-20 resize-none" name="conditions" value={data.conditions} onChange={update} placeholder="Conditions or diagnoses you want to share"/></Field>
        <Field label="Allergies & dietary needs" optional><textarea className="field min-h-24 resize-none" name="allergies" value={data.allergies} onChange={update}/></Field>
        <Field label="Current medications" optional><textarea className="field min-h-24 resize-none" name="medications" value={data.medications} onChange={update}/></Field>
        <Field label="Treatment stage" optional>{input('treatment',{placeholder:'Example: chemotherapy cycle 2'})}</Field>
        <Field label="Other health information" optional>{input('otherHealth')}</Field>
      </div>}
      {step===3&&<div className="mt-6 space-y-4">
        <Field label="Activity level"><select className="field" name="activityLevel" value={data.activityLevel} onChange={update}><option value="">Select an option</option><option>Mostly resting</option><option>Lightly active</option><option>Moderately active</option><option>Very active</option></select></Field>
        <Field label="Health goals" optional><textarea className="field min-h-24 resize-none" name="goals" value={data.goals} onChange={update} placeholder="Maintain energy, eat more protein, move gently"/></Field>
        <Field label="Preferences" optional><textarea className="field min-h-24 resize-none" name="preferences" value={data.preferences} onChange={update} placeholder="Foods, routines, accessibility, or communication preferences"/></Field>
        <p className="flex gap-2 rounded-xl bg-teal-light p-3 text-sm text-teal-dark"><Icon name="shield" size={19} className="shrink-0"/>Progress is saved in this browser as you go.</p>
      </div>}
      {step===4&&<div className="mt-6 space-y-3">
        {[
          ['Personal details',`${data.firstName} ${data.middleName} ${data.lastName}`.replace(/\s+/g,' ').trim(),`${data.username} · ${data.gender}`,0],
          ['Date of birth',new Date(`${data.dateOfBirth}T12:00:00`).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}),'Birthday',1],
          ['Health',`${data.height} cm · ${data.weight} kg`,data.conditions||'No medical conditions added',2],
          ['Lifestyle',data.activityLevel||'No activity level selected',data.goals||'No goals added',3],
        ].map(([title,primary,secondary,target])=><div key={title} className="flex items-start gap-4 rounded-2xl border border-line bg-canvas p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-light text-teal-dark"><Icon name={target===0?'user':target===1?'calendar':target===2?'heart':'activity'} size={20}/></span><div className="min-w-0 flex-1"><h4 className="font-bold">{title}</h4><p className="mt-1 text-sm text-ink">{primary}</p><p className="mt-1 truncate text-xs text-inkSoft">{secondary}</p></div><button type="button" onClick={()=>go(target)} className="text-sm font-bold text-teal-dark">Edit</button></div>)}
        <p className="flex gap-2 rounded-xl bg-teal-light p-3 text-sm text-teal-dark"><Icon name="shield" size={19} className="shrink-0"/>Your completed profile stays on this device unless you choose an AI feature.</p>
      </div>}
    </div>
    <div className="mt-7 flex items-center gap-3 border-t border-line pt-5">
      {step===0?(onCancel&&<BigButton type="button" variant="outline" onClick={onCancel}>Cancel</BigButton>):<BigButton type="button" variant="outline" onClick={()=>go(step-1)}>Back</BigButton>}
      <BigButton type="button" onClick={()=>step===4?finish():go(step+1)}>{step===4?<><Icon name="check"/>Finish setup</>:`Next: ${profileSteps[step+1].short}`}</BigButton>
    </div>
  </div>;
}

function Consent({ onAccept, onCancel }) {
  const [checked, setChecked] = useState(false);
  return <div className="mt-5">
    <div className="rounded-2xl bg-clay-light p-4">
      <div className="flex gap-3"><Icon name="shield" className="shrink-0 text-clay"/><div><h3 className="font-bold">Your information leaves this device</h3><p className="mt-2 text-sm leading-relaxed text-inkSoft">When you use AI chat, meal-photo analysis, lab-report analysis, or AI summaries, the selected profile details, wellness logs, questions, and images are sent to the configured AI provider—OpenAI, Google Gemini, or DeepSeek—for processing.</p></div></div>
    </div>
    <p className="mt-4 text-sm leading-relaxed text-inkSoft">The app does not maintain its own cloud database. The selected provider receives the submitted content and handles it under that provider&apos;s API data terms. Do not submit information you are not comfortable sharing. AI output can be wrong and is not a diagnosis or medical advice.</p>
    <label className="mt-4 flex cursor-pointer gap-3 rounded-2xl border border-line p-4"><input type="checkbox" className="mt-1 h-5 w-5 accent-teal" checked={checked} onChange={e=>setChecked(e.target.checked)}/><span className="text-sm font-bold">I understand and agree to send selected health information to the configured AI provider when I use an AI feature.</span></label>
    <div className="mt-5 flex gap-3"><BigButton variant="outline" onClick={onCancel}>Not now</BigButton><BigButton disabled={!checked} onClick={onAccept}>I agree</BigButton></div>
    <p className="mt-4 text-center text-xs text-inkSoft">Prototype disclaimer — obtain legal and clinical review before real patient use.</p>
  </div>;
}

function Chat({ onClose, profile }) {
  const [messages, setMessages] = useState([welcome]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef();
  useEffect(()=>endRef.current?.scrollIntoView({behavior:'smooth'}),[messages,loading]);
  async function send(e) {
    e.preventDefault(); if (!input.trim() || loading) return;
    const next=[...messages,{role:'user',text:input.trim()}]; setMessages(next);setInput('');setLoading(true);
    try {
      const context={meals:JSON.parse(localStorage.getItem('wc-meals')||'{}'),activity:JSON.parse(localStorage.getItem('wc-activity')||'{}'),symptoms:JSON.parse(localStorage.getItem('wc-checkin')||'{}'),bloodWork:JSON.parse(localStorage.getItem('wc-blood')||'[]')};
      const result=await callAi({mode:'chat',profile,context,messages:next});
      setMessages(m=>[...m,{role:'assistant',text:result.text}]);
    } catch(error) { setMessages(m=>[...m,{role:'error',text:error.message}]); }
    finally {setLoading(false)}
  }
  return <section className="fixed inset-x-0 bottom-0 z-[60] mx-auto flex h-[min(82vh,720px)] max-w-md flex-col overflow-hidden rounded-t-[28px] bg-surface shadow-2xl" role="dialog" aria-modal="true" aria-label="Wellness AI helper">
    <header className="flex items-center gap-3 border-b border-line p-4"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal text-white"><Smile/></span><div className="flex-1"><h2 className="font-display text-lg font-bold">Wellness AI</h2><p className="text-xs text-inkSoft">Approximate insights · Not medical advice</p></div><button className="icon-button rotate-45" onClick={onClose} aria-label="Close AI helper"><Icon name="plus"/></button></header>
    <div className="flex-1 space-y-3 overflow-y-auto bg-canvas/60 p-4" aria-live="polite">{messages.map((m,i)=><div key={i} className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role==='user'?'ml-auto bg-teal text-white':m.role==='error'?'bg-clay-light text-clay':'bg-surface text-ink shadow-sm'}`}>{m.text}</div>)}{loading&&<div className="w-fit rounded-2xl bg-surface px-4 py-3 text-sm text-inkSoft">Thinking…</div>}<div ref={endRef}/></div>
    <form onSubmit={send} className="flex gap-2 border-t border-line bg-surface p-3"><label className="sr-only" htmlFor="ai-message">Message</label><input id="ai-message" className="field" value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask about your wellness log"/><button className="icon-button shrink-0 bg-teal text-white hover:bg-teal-dark" disabled={!input.trim()||loading} aria-label="Send message"><Icon name="send" size={20}/></button></form>
  </section>;
}

function Smile(){return <svg aria-hidden="true" width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="16" cy="16" r="13"/><circle cx="11.5" cy="13" r="1" fill="currentColor"/><circle cx="20.5" cy="13" r="1" fill="currentColor"/><path d="M10 19c2.5 4 9.5 4 12 0"/></svg>}

export default function PrototypeShell() {
  const [profile,setProfile]=useState(null);const [consent,setConsent]=useState(false);const [stage,setStage]=useState(null);const [chat,setChat]=useState(false);
  useEffect(()=>{const s=getAiSettings();setProfile(s.profile);setConsent(s.consent);if(!s.profile)setStage('profile');const open=()=>startAi();const edit=()=>{setProfile(getAiSettings().profile);setStage('profile')};window.addEventListener('wc-open-ai-setup',open);window.addEventListener('wc-edit-profile',edit);return()=>{window.removeEventListener('wc-open-ai-setup',open);window.removeEventListener('wc-edit-profile',edit)}},[]);
  function startAi(){const s=getAiSettings();setProfile(s.profile);setConsent(s.consent);if(!s.profile)setStage('profile');else if(!s.consent)setStage('consent');else setChat(true)}
  function saveProfile(data){localStorage.setItem('wc-profile',JSON.stringify(data));setProfile(data);setStage('consent')}
  function accept(){localStorage.setItem('wc-ai-consent',JSON.stringify({accepted:true,version:'prototype-2-multi-provider',at:new Date().toISOString()}));setConsent(true);setStage(null);setChat(true)}
  return <><button onClick={startAi} className="fixed bottom-[88px] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal text-white shadow-[0_10px_30px_rgba(11,75,76,.35)] transition hover:scale-105" aria-label="Open Wellness AI helper"><Smile/></button>
   <Modal open={stage==='profile'} title="Set up your profile" onClose={()=>setStage(null)} className="sm:max-w-2xl"><p className="mt-2 text-sm text-inkSoft">Personalize your wellness tools. Your profile is saved on this device.</p><ProfileForm initial={profile||{}} onSave={saveProfile} onCancel={profile?()=>setStage(null):null}/></Modal>
   <Modal open={stage==='consent'} title="Before you use AI" onClose={()=>setStage(null)}><Consent onAccept={accept} onCancel={()=>setStage(null)}/></Modal>
   {chat&&<><div className="fixed inset-0 z-[55] bg-ink/40" onClick={()=>setChat(false)}/><Chat profile={profile} onClose={()=>setChat(false)}/></>}
  </>;
}
