'use client';
import { useRef, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import BigButton from '@/components/BigButton';
import Icon from '@/components/Icon';
import useStoredState from '@/components/useStoredState';
import { callAi, getAiSettings, readFileAsDataUrl, requestAiSetup } from '@/lib/aiClient';
import { estimateFromText } from '@/lib/mealNutrition';

const slots=['Breakfast','Lunch','Dinner','Snacks'];

export default function MealScanner(){
 const [meals,setMeals]=useStoredState('wc-meals',{});
 const cameraRef=useRef();const uploadRef=useRef();
 const [preview,setPreview]=useState('');const [analysis,setAnalysis]=useState('');const [nutrition,setNutrition]=useState(null);const [slot,setSlot]=useState('Dinner');const [analyzing,setAnalyzing]=useState(false);const [error,setError]=useState('');const [saved,setSaved]=useState(false);
 function reset(){setPreview('');setAnalysis('');setNutrition(null);setError('');setSaved(false)}
 async function analyze(file){if(!file)return;const settings=getAiSettings();if(!settings.profile||!settings.consent||!settings.config?.apiKey){requestAiSetup();return}setAnalyzing(true);setAnalysis('');setNutrition(null);setError('');setSaved(false);try{const image=await readFileAsDataUrl(file);setPreview(image);const result=await callAi({mode:'meal',image,profile:settings.profile,context:{meals}});setAnalysis(result.text);setNutrition(estimateFromText(result.text))}catch(reason){setError(reason.message)}finally{setAnalyzing(false)}}
 function chooseFile(e){const file=e.target.files?.[0];e.target.value='';analyze(file)}
 function save(){if(!analysis)return;setMeals(current=>({...current,[slot]:{detail:analysis,nutrition}}));setSaved(true)}
 return <div className="scanner-enter px-5 pb-5"><PageHeader title="Meal Scanner" backHref="/meals"/>
  <Card className="mt-4 overflow-hidden border-0 bg-teal p-6 text-white"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-teal-light">Photo estimate</p><h2 className="mt-1 font-display text-2xl font-bold">Scan your meal</h2><p className="mt-2 text-sm leading-relaxed text-white/75">Use a clear overhead or side photo with the full plate visible.</p></div><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15"><Icon name="camera"/></span></div></Card>
  <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={chooseFile}/><input ref={uploadRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={chooseFile}/>
  {!preview&&!analyzing&&<div className="mt-4 grid grid-cols-2 gap-3"><BigButton onClick={()=>cameraRef.current?.click()}><Icon name="camera"/>Use camera</BigButton><BigButton variant="secondary" onClick={()=>uploadRef.current?.click()}><Icon name="upload"/>Upload photo</BigButton></div>}
  {preview&&<Card className="mt-4"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Image preview</h2><button type="button" className="text-sm font-bold text-clay" onClick={reset}>Rescan</button></div><img src={preview} alt="Meal selected for analysis" className="mt-3 max-h-80 w-full rounded-2xl bg-canvas object-contain"/></Card>}
  {analyzing&&<Card className="mt-4"><div className="flex items-center gap-3"><span className="spinner h-7 w-7 shrink-0 rounded-full border-2 border-teal-light border-t-teal"/><div><p className="font-bold">Estimating your meal</p><p className="mt-1 text-sm text-inkSoft">Checking calories, protein, and relevant nutrition notes.</p></div></div></Card>}
  {error&&<Card className="mt-4 bg-clay-light"><div className="flex gap-3"><Icon name="info" className="shrink-0 text-clay"/><div><h2 className="font-bold">Photo analysis unavailable</h2><p className="mt-2 text-sm leading-relaxed text-inkSoft">{error}</p><button type="button" className="mt-3 text-sm font-bold text-clay" onClick={reset}>Try another photo</button></div></div></Card>}
  {analysis&&!saved&&<Card className="mt-4"><p className="eyebrow">Review before saving</p><h2 className="mt-1 font-display text-xl font-bold">Meal estimate</h2>{nutrition&&(nutrition.calories||nutrition.protein)&&<div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-gold-light p-3"><p className="text-xs font-bold uppercase text-inkSoft">Calories</p><p className="mt-1 text-xl font-bold">~{nutrition.calories||'—'} kcal</p></div><div className="rounded-2xl bg-teal-light p-3"><p className="text-xs font-bold uppercase text-inkSoft">Protein</p><p className="mt-1 text-xl font-bold">~{nutrition.protein||'—'} g</p></div></div>}<p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-inkSoft">{analysis}</p><label className="mt-4 block"><span className="label">Save as</span><select className="field" value={slot} onChange={e=>setSlot(e.target.value)}>{slots.map(item=><option key={item}>{item}</option>)}</select></label><div className="mt-4 grid grid-cols-2 gap-3"><button type="button" className="min-h-touch rounded-2xl border border-line font-bold text-clay" onClick={reset}>Rescan</button><BigButton onClick={save}><Icon name="check"/>Confirm & save</BigButton></div></Card>}
  {saved&&<Card className="mt-4 bg-teal-light"><div className="flex gap-3"><Icon name="check" className="shrink-0 text-teal-dark"/><div><h2 className="font-bold">Saved to {slot}</h2><p className="mt-1 text-sm text-inkSoft">Today&apos;s calorie and protein estimates were updated.</p><button type="button" className="mt-3 text-sm font-bold text-teal-dark" onClick={reset}>Scan another meal</button></div></div></Card>}
  <p className="mt-5 text-center text-xs leading-relaxed text-inkSoft">Meal-photo estimates are approximate and can vary with portions, ingredients, and preparation.</p>
 </div>
}
