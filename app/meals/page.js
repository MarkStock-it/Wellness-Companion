'use client';
import { useRef, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import BigButton from '@/components/BigButton';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import useStoredState from '@/components/useStoredState';
import { callAi, getAiSettings, readFileAsDataUrl, requestAiSetup } from '@/lib/aiClient';

const defaults = { Breakfast: 'Oatmeal with banana and tea', Lunch: 'Chicken soup and soft bread' };
const slots = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export default function MealsPage() {
  const [meals, setMeals] = useStoredState('wc-meals', defaults);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState('');
  const fileRef = useRef();
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  function open(slot) { setEditing(slot); setDetail(meals[slot] || ''); }
  function save(e) { e.preventDefault(); setMeals({ ...meals, [editing]: detail.trim() }); setEditing(null); }
  async function analyzePhoto(file) {
    const settings = getAiSettings();
    if (!settings.profile || !settings.consent) { requestAiSetup(); return; }
    setAnalysis(''); setAnalysisError(''); setAnalyzing(true);
    try {
      const image = await readFileAsDataUrl(file);
      const result = await callAi({ mode: 'meal', image, profile: settings.profile, context: { meals } });
      setAnalysis(result.text);
    } catch (error) { setAnalysisError(error.message); }
    finally { setAnalyzing(false); }
  }
  return (
    <div className="px-5 pb-5"><PageHeader title="Meal log" backHref="/" />
      <div className="mt-4 rounded-[22px] bg-teal-light p-5">
        <p className="eyebrow">Today&apos;s progress</p>
        <div className="mt-2 flex items-end justify-between"><strong className="font-display text-3xl">{Object.values(meals).filter(Boolean).length} of 4</strong><span className="text-sm text-inkSoft">meals logged</span></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-teal" style={{width: `${Object.values(meals).filter(Boolean).length * 25}%`}} /></div>
      </div>
      <div className="mt-5 space-y-3">
        {slots.map((slot, i) => <Card key={slot} className="flex items-center gap-4 p-4">
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${meals[slot] ? 'bg-teal text-white' : 'bg-canvas text-inkSoft'}`}>{meals[slot] ? <Icon name="check"/> : <span className="text-sm font-bold">0{i+1}</span>}</span>
          <div className="min-w-0 flex-1"><h2 className="font-bold">{slot}</h2><p className={`truncate text-sm ${meals[slot] ? 'text-inkSoft' : 'italic text-inkSoft'}`}>{meals[slot] || 'Not logged yet'}</p></div>
          <button className="icon-button bg-teal-light text-teal-dark" onClick={() => open(slot)} aria-label={`${meals[slot] ? 'Edit' : 'Add'} ${slot}`}><Icon name={meals[slot] ? 'clipboard' : 'plus'} size={20}/></button>
        </Card>)}
      </div>
      <input ref={fileRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(e) => { const file=e.target.files[0]; if(file) analyzePhoto(file); e.target.value=''; }}/>
      <BigButton variant="secondary" className="mt-5" onClick={() => fileRef.current?.click()} disabled={analyzing}><Icon name="camera"/> {analyzing ? 'Analyzing meal…' : 'Take a meal photo'}</BigButton>
      {(analysis || analysisError) && <Card className={`mt-4 ${analysisError?'bg-clay-light':'bg-teal-light'}`}><div className="flex gap-3"><Icon name={analysisError?'info':'sparkle'} className={`shrink-0 ${analysisError?'text-clay':'text-teal'}`}/><div><h2 className="font-bold">{analysisError?'Photo analysis unavailable':'AI meal estimate'}</h2><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-inkSoft">{analysisError||analysis}</p>{analysis&&<button type="button" className="mt-3 text-sm font-bold text-teal-dark" onClick={()=>{setEditing('Dinner');setDetail(analysis)}}>Add this note to dinner</button>}</div></div></Card>}
      <Modal open={!!editing} title={`Log ${editing || ''}`} onClose={() => setEditing(null)}>
        <form onSubmit={save} className="mt-5"><label className="label" htmlFor="meal-detail">What did you have?</label><textarea id="meal-detail" className="field min-h-28 resize-none" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Example: soup, toast and water" autoFocus/><BigButton type="submit" className="mt-4" disabled={!detail.trim()}>Save meal</BigButton>{meals[editing] && <button type="button" className="mt-3 w-full py-2 text-sm font-bold text-clay" onClick={() => { const next={...meals}; delete next[editing]; setMeals(next); setEditing(null); }}>Remove entry</button>}</form>
      </Modal>
    </div>
  );
}
