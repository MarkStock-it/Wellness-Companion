'use client';
import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import BigButton from '@/components/BigButton';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import useStoredState from '@/components/useStoredState';
import { estimateFromText, mealText } from '@/lib/mealNutrition';

const defaults = {};
const slots = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
export default function MealsPage() {
  const [meals, setMeals] = useStoredState('wc-meals', defaults);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState('');
  const [pendingNutrition,setPendingNutrition]=useState(null);
  const [showHoldHint,setShowHoldHint]=useState(false);
  useEffect(()=>{setShowHoldHint(localStorage.getItem('wc-meal-long-press-used')!=='true')},[]);
  function open(slot) { setEditing(slot); setDetail(mealText(meals[slot])); setPendingNutrition(typeof meals[slot]==='object'?meals[slot].nutrition:null); }
  function save(e) { e.preventDefault(); setMeals({ ...meals, [editing]: pendingNutrition?{detail:detail.trim(),nutrition:pendingNutrition}:detail.trim() }); setEditing(null);setPendingNutrition(null); }
  const logged=Object.values(meals).filter(value=>mealText(value).trim()).length;
  const nutrition=Object.values(meals).reduce((total,value)=>{const estimate=typeof value==='object'&&value.nutrition?value.nutrition:estimateFromText(mealText(value));return {calories:total.calories+(Number(estimate.calories)||0),protein:total.protein+(Number(estimate.protein)||0),count:total.count+(estimate.calories||estimate.protein?1:0)}},{calories:0,protein:0,count:0});
  return (
    <div className="px-5 pb-5"><PageHeader title="Meal log" backHref="/" />
      {showHoldHint&&<div className="mb-1 mt-2 flex items-center gap-2 rounded-xl border border-line bg-surface/70 px-3 py-2 text-xs text-inkSoft"><Icon name="info" size={16} className="shrink-0"/><p><strong className="text-ink">Hold the Meals icon below</strong> to open the Meal Scanner.</p></div>}
      <div className="mt-4 rounded-[22px] bg-teal-light p-5">
        <p className="eyebrow">Today&apos;s progress</p>
        <div className="mt-3 grid grid-cols-2 gap-3"><div><strong className="font-display text-3xl">{nutrition.count?`~${nutrition.calories}`:'—'}</strong><span className="ml-1 text-sm text-inkSoft">kcal</span><p className="mt-1 text-xs text-inkSoft">Estimated calories</p></div><div className="border-l border-teal/20 pl-4"><strong className="font-display text-3xl">{nutrition.count?`~${nutrition.protein}`:'—'}</strong><span className="ml-1 text-sm text-inkSoft">g</span><p className="mt-1 text-xs text-inkSoft">Estimated protein</p></div></div>
        <div className="mt-4 flex items-center justify-between text-xs text-inkSoft"><span>{logged} of 4 meals logged</span><span>{nutrition.count} with estimates</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-teal" style={{width: `${logged * 25}%`}} /></div>
      </div>
      <div className="mt-5 space-y-3">
        {slots.map((slot, i) => <Card key={slot} className="flex items-center gap-4 p-4">
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${meals[slot] ? 'bg-teal text-white' : 'bg-canvas text-inkSoft'}`}>{meals[slot] ? <Icon name="check"/> : <span className="text-sm font-bold">0{i+1}</span>}</span>
          <div className="min-w-0 flex-1"><h2 className="font-bold">{slot}</h2><p className={`truncate text-sm ${meals[slot] ? 'text-inkSoft' : 'italic text-inkSoft'}`}>{mealText(meals[slot]) || 'Not logged yet'}</p></div>
          <button className="icon-button bg-teal-light text-teal-dark" onClick={() => open(slot)} aria-label={`${meals[slot] ? 'Edit' : 'Add'} ${slot}`}><Icon name={meals[slot] ? 'clipboard' : 'plus'} size={20}/></button>
        </Card>)}
      </div>
      <Modal open={!!editing} title={`Log ${editing || ''}`} onClose={() => setEditing(null)}>
        <form onSubmit={save} className="mt-5"><label className="label" htmlFor="meal-detail">What did you have?</label><textarea id="meal-detail" className="field min-h-28 resize-none" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Example: soup, toast and water" autoFocus/>{pendingNutrition&&(pendingNutrition.calories||pendingNutrition.protein)&&<p className="mt-3 rounded-xl bg-teal-light p-3 text-sm text-teal-dark">This entry includes an estimate of {pendingNutrition.calories||'—'} kcal and {pendingNutrition.protein||'—'} g protein.</p>}<BigButton type="submit" className="mt-4" disabled={!detail.trim()}>Save meal</BigButton>{meals[editing] && <button type="button" className="mt-3 w-full py-2 text-sm font-bold text-clay" onClick={() => { const next={...meals}; delete next[editing]; setMeals(next); setEditing(null);setPendingNutrition(null); }}>Remove entry</button>}</form>
      </Modal>
    </div>
  );
}
