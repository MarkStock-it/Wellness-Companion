'use client';
import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import BigButton from '@/components/BigButton';
import Icon from '@/components/Icon';
import useStoredState from '@/components/useStoredState';

const questions = [
  ['appetite','Appetite',['Low','Some','Good']],
  ['nausea','Nausea',['None','A little','A lot']],
  ['fatigue','Fatigue',['Low','Some','High']],
  ['mood','Mood',['Down','Okay','Good']],
];
function Face({ level }) { return <svg aria-hidden="true" width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="16" cy="16" r="13"/><circle cx="11.5" cy="13" r="1" fill="currentColor"/><circle cx="20.5" cy="13" r="1" fill="currentColor"/>{level === 0 ? <path d="M11 22c2-3 8-3 10 0"/> : level === 1 ? <path d="M11 21h10"/> : <path d="M11 19c2 3 8 3 10 0"/>}</svg>}
export default function SymptomsPage() {
  const [stored, setStored] = useStoredState('wc-checkin', {});
  const [answers, setAnswers] = useState(stored);
  const [saved, setSaved] = useState(false);
  return <div className="px-5 pb-5"><PageHeader title="Daily check-in" backHref="/more"/>
    <p className="mt-4 text-base text-inkSoft">Take a moment to tell us how you feel today.</p>
    <div className="mt-5 space-y-4">{questions.map(([key,label,options]) => <Card key={key}><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">{label}</h2>{answers[key] && <Icon name="check" className="text-teal"/>}</div>
      <div className="mt-4 grid grid-cols-3 gap-2">{options.map((text,i) => { const selected=answers[key]===text; return <button key={text} aria-pressed={selected} onClick={() => {setSaved(false);setAnswers({...answers,[key]:text})}} className={`flex min-h-[86px] flex-col items-center justify-center gap-1 rounded-2xl border text-sm font-bold ${selected?'border-teal bg-teal-light text-teal-dark':'border-line bg-canvas text-inkSoft'}`}><Face level={key==='nausea'||key==='fatigue'?2-i:i}/>{text}</button>})}</div>
    </Card>)}</div>
    <BigButton className="mt-5" disabled={Object.keys(answers).length < 4} onClick={() => {setStored(answers);setSaved(true)}}>{saved ? <><Icon name="check"/> Check-in saved</> : 'Save today’s check-in'}</BigButton>
  </div>;
}
