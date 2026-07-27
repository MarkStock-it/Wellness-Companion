'use client';
import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import BigButton from '@/components/BigButton';
import Icon from '@/components/Icon';
import { callAi, getAiSettings, requestAiSetup } from '@/lib/aiClient';

export default function AiSummaryPage() {
  const [loading,setLoading]=useState(false);const [summary,setSummary]=useState('');const [error,setError]=useState('');
  async function refresh(){
    const settings=getAiSettings();if(!settings.profile||!settings.consent){requestAiSetup();return}
    setLoading(true);setError('');
    try{const context={meals:JSON.parse(localStorage.getItem('wc-meals')||'{}'),activity:JSON.parse(localStorage.getItem('wc-activity')||'{}'),symptoms:JSON.parse(localStorage.getItem('wc-checkin')||'{}'),bloodWork:JSON.parse(localStorage.getItem('wc-blood-v2')||'[]')};const result=await callAi({mode:'summary',profile:settings.profile,context});setSummary(result.text)}
    catch(e){setError(e.message)}finally{setLoading(false)}
  }
  return <div className="px-5 pb-5"><PageHeader title="AI health summary" backHref="/more"/>
    <Card className="mt-4 border-0 bg-gradient-to-br from-teal to-teal-dark text-white"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Icon name="sparkle"/></span><p className="mt-4 text-sm font-bold uppercase tracking-widest text-teal-light">Live AI overview</p><h2 className="mt-1 font-display text-2xl font-bold">{summary?'Your wellness patterns':'Ready when you are'}</h2>{loading?<div className="mt-5 flex items-center gap-3"><span className="spinner h-7 w-7 rounded-full border-2 border-white/30 border-t-white"/><p className="text-sm text-white/80">Reviewing your local entries…</p></div>:<p className="mt-3 whitespace-pre-line text-base leading-relaxed text-white/90">{summary||'Generate a fresh plain-language summary using your profile, meals, activity, symptoms, and recent lab entries.'}</p>}</Card>
    {error&&<p className="mt-4 rounded-2xl bg-clay-light p-4 text-sm text-clay">{error}</p>}
    <p className="mt-4 flex gap-2 rounded-2xl bg-gold-light p-4 text-sm leading-relaxed text-inkSoft"><Icon name="info" className="shrink-0 text-gold"/>Educational only, not medical advice. Information is sent to OpenAI when you generate this summary.</p>
    <BigButton className="mt-5" onClick={refresh} disabled={loading}><Icon name="sparkle"/>{summary?'Refresh summary':'Generate my summary'}</BigButton>
  </div>
}
