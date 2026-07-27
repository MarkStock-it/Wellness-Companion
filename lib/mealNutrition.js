export function mealText(value) {
  if(Array.isArray(value))return value.map(mealText).filter(Boolean).join(' · ');
  return typeof value === 'string' ? value : value?.detail || '';
}

export function mealEntries(value) {
  const entries=Array.isArray(value)?value:[value];
  return entries.filter(entry=>mealText(entry).trim());
}

export function localDateKey(date=new Date()) {
  const year=date.getFullYear(),month=String(date.getMonth()+1).padStart(2,'0'),day=String(date.getDate()).padStart(2,'0');
  return`${year}-${month}-${day}`;
}

function legacySnackId(entry,index,date){
  const source=`${date}|${index}|${mealText(entry)}`;let hash=2166136261;
  for(let position=0;position<source.length;position+=1){hash^=source.charCodeAt(position);hash=Math.imul(hash,16777619)}
  return`snack-${date}-${(hash>>>0).toString(36)}`;
}

export function normalizeSnackLogs(value,fallbackDate=localDateKey()) {
  return mealEntries(value).map((entry,index)=>{
    const object=typeof entry==='string'?{detail:entry}:{...entry};
    return{...object,id:object.id||legacySnackId(entry,index,object.date||fallbackDate),date:object.date||fallbackDate};
  });
}

export function createSnackLog(value,nutrition=null,date=localDateKey()) {
  const id=globalThis.crypto?.randomUUID?.()||`snack-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  return{id,date,loggedAt:new Date().toISOString(),detail:String(value||'').trim(),...(nutrition?{nutrition}:{})};
}

export function appendSnackLog(value,detail,nutrition=null,date=localDateKey()) {
  return[...normalizeSnackLogs(value,date),createSnackLog(detail,nutrition,date)];
}

export function updateSnackLog(value,id,detail,nutrition=null) {
  return normalizeSnackLogs(value).map(entry=>{
    if(entry.id!==id)return entry;
    const{nutrition:discarded,...base}=entry;
    return{...base,detail:String(detail||'').trim(),...(nutrition?{nutrition}:{})};
  });
}

export function removeSnackLog(value,id) {
  return normalizeSnackLogs(value).filter(entry=>entry.id!==id);
}

export function snackLogsForDate(value,date=localDateKey()) {
  return normalizeSnackLogs(value,date).filter(entry=>entry.date===date);
}

export function countLoggedMealSections(meals={},date=localDateKey()) {
  return['Breakfast','Lunch','Dinner'].filter(slot=>mealEntries(meals[slot]).length).length+(snackLogsForDate(meals.Snacks,date).length?1:0);
}

export function sumMealNutrition(entries=[]) {
  return entries.reduce((total,value)=>{
    const estimate=typeof value==='object'&&value.nutrition?value.nutrition:estimateFromText(mealText(value));
    return{calories:total.calories+(Number(estimate.calories)||0),protein:total.protein+(Number(estimate.protein)||0),count:total.count+(estimate.calories||estimate.protein?1:0)};
  },{calories:0,protein:0,count:0});
}

export function estimateFromText(text) {
  const source=String(text||'').replace(/,/g,'');
  function amount(kind){
    const suffix=kind==='calories'?'(?:kcal|calories?)':'(?:g|grams?)';
    const label=kind==='calories'?'(?:estimated\\s*)?(?:calories?|energy)':'(?:estimated\\s*)?protein';
    const range=source.match(new RegExp(`${label}[^\\d]{0,20}(\\d+(?:\\.\\d+)?)\\s*(?:-|–|to)\\s*(\\d+(?:\\.\\d+)?)\\s*${suffix}`,'i'));
    const single=source.match(new RegExp(`${label}[^\\d]{0,20}(\\d+(?:\\.\\d+)?)\\s*${suffix}`,'i'));
    return range?Math.round((Number(range[1])+Number(range[2]))/2):single?Math.round(Number(single[1])):null;
  }
  return {calories:amount('calories'),protein:amount('protein')};
}
