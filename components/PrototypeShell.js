'use client';
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import BigButton from './BigButton';
import Modal from './Modal';
import { callAi, getAiSettings } from '@/lib/aiClient';

const welcome = { role: 'assistant', text: 'Hi. I can help you understand patterns in your wellness log. What would you like to know?' };

function ProfileForm({ initial = {}, onSave, onCancel }) {
  function submit(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    data.localId = initial.localId || crypto.randomUUID();
    onSave(data);
  }
  return <form onSubmit={submit} className="mt-5 space-y-4">
    <div className="grid grid-cols-2 gap-3">
      <label className="col-span-2"><span className="label">Name</span><input className="field" name="name" defaultValue={initial.name} required autoFocus/></label>
      <label><span className="label">Age</span><input className="field" type="number" name="age" min="18" max="120" defaultValue={initial.age} required/></label>
      <label><span className="label">Gender</span><select className="field" name="gender" defaultValue={initial.gender || ''} required><option value="" disabled>Select</option><option>Woman</option><option>Man</option><option>Non-binary</option><option>Prefer not to say</option></select></label>
      <label><span className="label">Height (cm)</span><input className="field" type="number" name="height" min="80" max="250" defaultValue={initial.height} required/></label>
      <label><span className="label">Weight (kg)</span><input className="field" type="number" step=".1" name="weight" min="20" max="400" defaultValue={initial.weight} required/></label>
    </div>
    <label className="block"><span className="label">Health goals</span><textarea className="field min-h-20 resize-none" name="goals" defaultValue={initial.goals} placeholder="Maintain energy, eat more protein"/></label>
    <label className="block"><span className="label">Diagnosis or condition</span><input className="field" name="condition" defaultValue={initial.condition} placeholder="Optional"/></label>
    <label className="block"><span className="label">Treatment stage</span><input className="field" name="treatment" defaultValue={initial.treatment} placeholder="Example: chemotherapy cycle 2"/></label>
    <label className="block"><span className="label">Medications</span><textarea className="field min-h-20 resize-none" name="medications" defaultValue={initial.medications} placeholder="Names only; never change them based on AI output"/></label>
    <label className="block"><span className="label">Allergies & dietary needs</span><textarea className="field min-h-20 resize-none" name="dietary" defaultValue={initial.dietary} placeholder="Allergies, restrictions, texture needs"/></label>
    <p className="flex gap-2 rounded-xl bg-teal-light p-3 text-sm text-teal-dark"><Icon name="shield" size={19} className="shrink-0"/>This profile stays in this browser unless you choose an AI feature.</p>
    <div className="flex gap-3">{onCancel && <BigButton type="button" variant="outline" onClick={onCancel}>Cancel</BigButton>}<BigButton type="submit">Save profile</BigButton></div>
  </form>;
}

function Consent({ onAccept, onCancel }) {
  const [checked, setChecked] = useState(false);
  return <div className="mt-5">
    <div className="rounded-2xl bg-clay-light p-4">
      <div className="flex gap-3"><Icon name="shield" className="shrink-0 text-clay"/><div><h3 className="font-bold">Your information leaves this device</h3><p className="mt-2 text-sm leading-relaxed text-inkSoft">When you use AI chat, meal-photo analysis, lab-report analysis, or AI summaries, the selected profile details, wellness logs, questions, and images are sent to OpenAI&apos;s servers for processing.</p></div></div>
    </div>
    <p className="mt-4 text-sm leading-relaxed text-inkSoft">The app does not maintain its own cloud database. AI requests use <strong>store: false</strong>, but OpenAI may retain request data temporarily for abuse monitoring according to your API account&apos;s data controls. Do not submit information you are not comfortable sharing. AI output can be wrong and is not a diagnosis or medical advice.</p>
    <label className="mt-4 flex cursor-pointer gap-3 rounded-2xl border border-line p-4"><input type="checkbox" className="mt-1 h-5 w-5 accent-teal" checked={checked} onChange={e=>setChecked(e.target.checked)}/><span className="text-sm font-bold">I understand and agree to send selected health information to OpenAI when I use an AI feature.</span></label>
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
  function accept(){localStorage.setItem('wc-ai-consent',JSON.stringify({accepted:true,version:'prototype-1',at:new Date().toISOString()}));setConsent(true);setStage(null);setChat(true)}
  return <><button onClick={startAi} className="fixed bottom-[88px] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal text-white shadow-[0_10px_30px_rgba(11,75,76,.35)] transition hover:scale-105" aria-label="Open Wellness AI helper"><Smile/></button>
   <Modal open={stage==='profile'} title="Set up your profile" onClose={()=>setStage(null)}><p className="mt-2 text-sm text-inkSoft">Personalize your wellness tools. Your profile is saved on this device.</p><ProfileForm initial={profile||{}} onSave={saveProfile} onCancel={profile?()=>setStage(null):null}/></Modal>
   <Modal open={stage==='consent'} title="Before you use AI" onClose={()=>setStage(null)}><Consent onAccept={accept} onCancel={()=>setStage(null)}/></Modal>
   {chat&&<><div className="fixed inset-0 z-[55] bg-ink/40" onClick={()=>setChat(false)}/><Chat profile={profile} onClose={()=>setChat(false)}/></>}
  </>;
}
