const PROFILE_FIELDS=['dateOfBirth','gender','height','weight','conditions','allergies','medications','treatment','otherHealth','activityLevel','goals','preferences'];

function short(value,max=1000){return String(value||'').replace(/\s+/g,' ').trim().slice(0,max)}
function present(object){return Object.fromEntries(Object.entries(object).filter(([,value])=>value!==''&&value!==null&&value!==undefined&&(!Array.isArray(value)||value.length)))}
function compactValue(value,depth=0){
 if(typeof value==='string')return short(value,500);
 if(typeof value==='number'||typeof value==='boolean'||value===null)return value;
 if(Array.isArray(value))return value.slice(0,20).map(item=>compactValue(item,depth+1));
 if(value&&typeof value==='object'&&depth<4)return Object.fromEntries(Object.entries(value).filter(([key])=>!['image','preview','id','localId','loggedAt','createdAt','savedAt','firstName','middleName','lastName','username'].includes(key)).slice(0,30).map(([key,item])=>[key,compactValue(item,depth+1)]));
 return undefined;
}
function compactProfile(profile={}){return present(Object.fromEntries(PROFILE_FIELDS.map(key=>[key,short(profile[key],400)])))}
function compactRecipe(recipe={}){
 return present({
  id:short(recipe.id,80),title:short(recipe.title,140),category:short(recipe.category,60),area:short(recipe.area,60),
  ingredients:(recipe.ingredients||[]).slice(0,20).map(item=>present({name:short(item.name,80),measure:short(item.measure,50)})),
  instructions:(recipe.instructions||[]).slice(0,12).map(step=>short(step,350)).filter(Boolean),
 });
}
function compactOcr(value){
 const seen=new Set();
 return String(value||'').split(/\r?\n/).map(line=>short(line,300)).filter(line=>{
  const key=line.toLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true;
 }).join('\n').slice(0,5000);
}
function compactContext(context={}){
 return present({
  meals:compactValue(context.meals||{}),
  activity:compactValue(context.activity||{}),
  symptoms:compactValue(context.symptoms||{}),
  bloodWork:compactValue(Array.isArray(context.bloodWork)?context.bloodWork.slice(0,8):[]),
 });
}

export function optimizeAiPayload(payload={}){
 const mode=payload.mode;
 const optimized={mode};
 if(mode==='chat'){
  optimized.profile=compactProfile(payload.profile);
  optimized.context=compactContext(payload.context);
  optimized.messages=(payload.messages||[]).filter(message=>message?.text&&message.text!==`Hi — I’m here to help you think through your wellness data. Ask about patterns, meals, symptoms, activity, or lab trends.`).slice(-6).map(message=>({role:message.role==='assistant'?'assistant':'user',text:short(message.text,1200)}));
 }
 if(mode==='summary'){optimized.profile=compactProfile(payload.profile);optimized.context=compactContext(payload.context)}
 if(mode==='meal'){optimized.profile=compactProfile(payload.profile);optimized.image=payload.image}
 if(mode==='lab'){optimized.image=payload.image}
 if(mode==='lab-text'){optimized.documentText=compactOcr(payload.documentText)}
 if(mode==='lab-consensus')optimized.ocrScans=(payload.ocrScans||[]).slice(0,3).map(compactOcr);
 if(mode==='recipe-intent')optimized.query=short(payload.query,200);
 if(mode==='recipe-analysis'){optimized.profile=compactProfile(payload.profile);optimized.recipe=compactRecipe(payload.recipe)}
 return optimized;
}

export function aiOutputBudget(payload={}){
 if(payload.mode==='recipe-intent')return 220;
 if(payload.mode==='summary'||payload.mode==='meal')return 320;
 if(payload.mode==='recipe-analysis')return 900;
 if(payload.mode==='lab')return 1600;
 if(payload.mode==='lab-text'||payload.mode==='lab-consensus'){
  const size=payload.mode==='lab-text'?String(payload.documentText||'').length:(payload.ocrScans||[]).join('').length;
  return size<4500?1000:size<9000?1400:2000;
 }
 if(payload.mode==='chat')return wantsRecipeOutput(payload)?1600:800;
 return 800;
}

export function wantsRecipeOutput(payload={}){
 const latest=String(payload.messages?.at(-1)?.text||'').toLowerCase();
 return/\b(recipe|meal plan)\b/.test(latest)||/\b(make|cook|prepare|suggest|create|give|want|need|idea|ideas)\b.{0,40}\b(breakfast|lunch|dinner|snack|food|meal)\b/.test(latest)||/\b(breakfast|lunch|dinner|snack|food|meal)\b.{0,40}\b(idea|ideas)\b/.test(latest);
}

export function aiCacheTtl(mode){
 return{summary:300000,meal:3600000,'lab-consensus':3600000,'recipe-analysis':604800000}[mode]||0;
}

export async function aiCacheKey(payload,provider=''){
 const source=JSON.stringify({provider,payload});
 if(globalThis.crypto?.subtle){
  const digest=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(source));
  const hash=[...new Uint8Array(digest)].slice(0,12).map(value=>value.toString(16).padStart(2,'0')).join('');
  return`wc-ai-cache-${payload.mode}-${hash}`;
 }
 let hash=2166136261;for(let index=0;index<source.length;index+=1){hash^=source.charCodeAt(index);hash=Math.imul(hash,16777619)}
 return`wc-ai-cache-${payload.mode}-${(hash>>>0).toString(36)}`;
}
