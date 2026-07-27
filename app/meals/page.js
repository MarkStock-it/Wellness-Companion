'use client';
import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import BigButton from '@/components/BigButton';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import useStoredState from '@/components/useStoredState';
import { appendSnackLog, countLoggedMealSections, localDateKey, mealEntries, mealText, normalizeSnackLogs, removeSnackLog, snackLogsForDate, sumMealNutrition, updateSnackLog } from '@/lib/mealNutrition';

const defaults = {Snacks:[]};
const mealSlots = ['Breakfast', 'Lunch', 'Dinner'];
export default function MealsPage() {
  const [meals, setMeals, mealsReady] = useStoredState('wc-meals', defaults);
  const [expanded,setExpanded]=useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState('');
  const [pendingNutrition,setPendingNutrition]=useState(null);
  const [showHoldHint,setShowHoldHint]=useState(false);
  useEffect(()=>{setShowHoldHint(localStorage.getItem('wc-meal-long-press-used')!=='true')},[]);
  useEffect(()=>{if(!mealsReady)return;const current=meals.Snacks,needsMigration=!Array.isArray(current)||(current||[]).some(entry=>typeof entry==='string'||!entry?.id||!entry?.date);if(needsMigration)setMeals(value=>({...value,Snacks:normalizeSnackLogs(value.Snacks)}))},[mealsReady,meals.Snacks,setMeals]);
  const today=localDateKey();
  const snackLogs=snackLogsForDate(meals.Snacks,today);
  function openMeal(slot) {const entry=mealEntries(meals[slot])[0];setEditing({slot});setDetail(mealText(entry));setPendingNutrition(typeof entry==='object'?entry.nutrition||null:null)}
  function openSnack(id=null) {const entry=snackLogs.find(item=>item.id===id);setEditing({slot:'Snacks',id});setDetail(mealText(entry));setPendingNutrition(entry?.nutrition||null)}
  function closeEditor(){setEditing(null);setDetail('');setPendingNutrition(null)}
  function save(e) {
    e.preventDefault();const text=detail.trim();
    setMeals(current=>{
      if(editing.slot!=='Snacks')return{...current,[editing.slot]:pendingNutrition?{detail:text,nutrition:pendingNutrition}:text};
      return{...current,Snacks:editing.id?updateSnackLog(current.Snacks,editing.id,text,pendingNutrition):appendSnackLog(current.Snacks,text,pendingNutrition)};
    });
    closeEditor();
  }
  function removeEntry(){
    setMeals(current=>{
      if(editing.slot==='Snacks')return{...current,Snacks:removeSnackLog(current.Snacks,editing.id)};
      const next={...current};delete next[editing.slot];return next;
    });
    closeEditor();
  }
  const logged=countLoggedMealSections(meals,today);
  const todaysEntries=[...mealSlots.flatMap(slot=>mealEntries(meals[slot])),...snackLogs];
  const nutrition=sumMealNutrition(todaysEntries);
  return (
    <div className="px-5 pb-5"><PageHeader title="Meal log" backHref="/" />
      {showHoldHint&&<div className="mb-1 mt-2 flex items-center gap-2 rounded-xl border border-line bg-surface/70 px-3 py-2 text-xs text-inkSoft"><Icon name="info" size={16} className="shrink-0"/><p><strong className="text-ink">Hold the Meals icon below</strong> to open the Meal Scanner.</p></div>}
      <div className="mt-4 rounded-[22px] bg-teal-light p-5">
        <p className="eyebrow">Today&apos;s progress</p>
        <div className="mt-3 grid grid-cols-2 gap-3"><div><strong className="font-display text-3xl">{nutrition.count?`~${nutrition.calories}`:'—'}</strong><span className="ml-1 text-sm text-inkSoft">kcal</span><p className="mt-1 text-xs text-inkSoft">Estimated calories</p></div><div className="border-l border-teal/20 pl-4"><strong className="font-display text-3xl">{nutrition.count?`~${nutrition.protein}`:'—'}</strong><span className="ml-1 text-sm text-inkSoft">g</span><p className="mt-1 text-xs text-inkSoft">Estimated protein</p></div></div>
        <div className="mt-4 flex items-center justify-between text-xs text-inkSoft"><span>{logged} of 4 meals logged</span><span>{nutrition.count} with estimates</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-teal" style={{width: `${logged * 25}%`}} /></div>
      </div>
      <Card className="mt-5 overflow-hidden p-0">
        <button type="button" id="meal-accordion-toggle" className="flex min-h-[76px] w-full items-center gap-4 px-4 py-3 text-left" aria-expanded={expanded} aria-controls="meal-accordion-panel" onClick={()=>setExpanded(value=>!value)}>
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${logged?'bg-teal text-white':'bg-canvas text-inkSoft'}`}><Icon name="meals" size={22}/></span>
          <span className="min-w-0 flex-1"><span className="block font-display text-xl font-bold">Today&apos;s meals</span><span className="mt-1 block text-sm text-inkSoft">{logged} of 4 sections logged{snackLogs.length?` · ${snackLogs.length} ${snackLogs.length===1?'snack':'snacks'}`:''}</span></span>
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-light text-teal-dark transition-transform duration-300 ${expanded?'rotate-90':''}`}><Icon name="chevron" size={20}/></span>
        </button>
        <div id="meal-accordion-panel" role="region" aria-labelledby="meal-accordion-toggle" aria-hidden={!expanded} className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${expanded?'grid-rows-[1fr] opacity-100':'grid-rows-[0fr] opacity-0'}`}>
          <div className="min-h-0 overflow-hidden">
            <div className="border-t border-line">
              {mealSlots.map((slot,index)=>{const entry=mealEntries(meals[slot])[0],hasEntry=Boolean(entry);return <div key={slot} className="flex items-center gap-3 border-b border-line px-4 py-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${hasEntry?'bg-teal text-white':'bg-canvas text-inkSoft'}`}>{hasEntry?<Icon name="check" size={18}/>:<span className="text-xs font-bold">0{index+1}</span>}</span>
                <div className="min-w-0 flex-1"><h2 className="font-bold">{slot}</h2><p className={`truncate text-sm ${hasEntry?'text-inkSoft':'italic text-inkSoft'}`}>{mealText(entry)||'Not logged yet'}</p></div>
                <button type="button" tabIndex={expanded?0:-1} className="icon-button shrink-0 bg-teal-light text-teal-dark" onClick={()=>openMeal(slot)} aria-label={`${hasEntry?'Edit':'Add'} ${slot}`}><Icon name={hasEntry?'clipboard':'plus'} size={20}/></button>
              </div>})}
              <section aria-labelledby="snacks-heading" className="px-4 py-4">
                <div className="flex items-center gap-3"><div className="min-w-0 flex-1"><h2 id="snacks-heading" className="font-bold">Snacks</h2><p className="mt-1 text-sm text-inkSoft">{snackLogs.length?`${snackLogs.length} logged today`:'Add as many snacks as you need'}</p></div><button type="button" tabIndex={expanded?0:-1} className="inline-flex min-h-touch items-center gap-2 rounded-xl bg-teal-light px-3 text-sm font-bold text-teal-dark" onClick={()=>openSnack()}><Icon name="plus" size={18}/>Add snack</button></div>
                {snackLogs.length>0?<div className="mt-3 space-y-2">{snackLogs.map((snack,index)=><button type="button" tabIndex={expanded?0:-1} key={snack.id} onClick={()=>openSnack(snack.id)} className="flex min-h-touch w-full items-center gap-3 rounded-xl bg-canvas px-3 py-2 text-left"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-light text-xs font-bold text-gold">{index+1}</span><span className="min-w-0 flex-1 truncate text-sm font-medium">{mealText(snack)}</span><Icon name="chevron" size={18} className="shrink-0 text-inkSoft"/></button>)}</div>:null}
              </section>
            </div>
          </div>
        </div>
      </Card>
      <Modal open={!!editing} title={editing?.slot==='Snacks'?(editing.id?'Edit snack':'Add snack'):`Log ${editing?.slot||''}`} onClose={closeEditor}>
        <form onSubmit={save} className="mt-5"><label className="label" htmlFor="meal-detail">What did you have?</label><textarea id="meal-detail" className="field min-h-28 resize-none" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Example: soup, toast and water" autoFocus/>{pendingNutrition&&(pendingNutrition.calories||pendingNutrition.protein)&&<p className="mt-3 rounded-xl bg-teal-light p-3 text-sm text-teal-dark">This entry includes an estimate of {pendingNutrition.calories||'—'} kcal and {pendingNutrition.protein||'—'} g protein.</p>}<BigButton type="submit" className="mt-4" disabled={!detail.trim()}>{editing?.slot==='Snacks'?'Save snack':'Save meal'}</BigButton>{editing&&(editing.slot==='Snacks'?Boolean(editing.id):mealEntries(meals[editing.slot]).length>0)&&<button type="button" className="mt-3 w-full py-2 text-sm font-bold text-clay" onClick={removeEntry}>Remove entry</button>}</form>
      </Modal>
    </div>
  );
}
