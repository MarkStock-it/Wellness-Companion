import { aiCacheKey, aiCacheTtl, aiOutputBudget, optimizeAiPayload, wantsRecipeOutput } from '@/lib/aiEfficiency';

export function getAiSettings() {
  try {
    const savedConsent = JSON.parse(localStorage.getItem('wc-ai-consent') || 'false');
    return {
      profile: JSON.parse(localStorage.getItem('wc-profile') || 'null'),
      consent: savedConsent?.accepted === true && savedConsent.version === 'prototype-2-multi-provider',
      config: JSON.parse(sessionStorage.getItem('wc-ai-session-config') || 'null'),
    };
  } catch {
    return { profile: null, consent: false, config: null };
  }
}

export function requestAiSetup() {
  window.dispatchEvent(new Event('wc-open-ai-setup'));
}

function rawDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function readFileAsDataUrl(file,{maxSide=1600,quality=.82}={}) {
  const original = await rawDataUrl(file);
  try {
    const image = new Image();
    const loaded = new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
    image.src = original;
    await loaded;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return original;
  }
}

export async function callAi(payload) {
  const config = getAiSettings().config;
  if (!config?.provider || !config?.apiKey) {
    requestAiSetup();
    throw new Error('Choose an AI provider and enter an API key first.');
  }
  const optimized=optimizeAiPayload(payload);const ttl=aiCacheTtl(optimized.mode);const cacheKey=ttl?await aiCacheKey(optimized,config.provider):'';
  if(cacheKey)try{const cached=JSON.parse(sessionStorage.getItem(cacheKey)||'null');if(cached&&Date.now()-cached.savedAt<ttl)return cached.result}catch{}
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true'){const result=await callAiDirect(optimized,config);if(cacheKey)try{sessionStorage.setItem(cacheKey,JSON.stringify({savedAt:Date.now(),result}))}catch{}return result}
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...optimized, aiConfig: config }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reference = data.requestId ? ` Reference: ${data.requestId}.` : '';
    throw new Error(`${data.error || 'The AI service is unavailable right now.'}${reference}`);
  }
  if(cacheKey)try{sessionStorage.setItem(cacheKey,JSON.stringify({savedAt:Date.now(),result:data}))}catch{}
  return data;
}

function directPrompt(payload) {
  const supplied={};if(Object.keys(payload.profile||{}).length)supplied.profile=payload.profile;if(Object.keys(payload.context||{}).length)supplied.context=payload.context;
  const background=Object.keys(supplied).length?`User-supplied local context:\n${JSON.stringify(supplied)}\n\n`:'';
  let task='';
  if(payload.mode==='chat'){const wantsRecipe=wantsRecipeOutput(payload);task=wantsRecipe?`Return JSON only: {"reply":"plain response","activities":[],"recipeIdeas":[{"title":"title","overview":"description","ingredients":[{"name":"ingredient","measure":"amount"}],"instructions":["step"],"prepTime":"estimate","cookTime":"estimate","totalTime":"estimate","servings":"number","calories":"estimate or unavailable","protein":"estimate or unavailable","difficulty":"Easy, Moderate, or Advanced","tags":["tag"]}]}. Give 1–2 requested recipes, realistic portions, labeled estimates, at most 15 ingredients and 10 steps.\n`:`Return JSON only: {"reply":"plain response","activities":[{"title":"activity","duration":"duration"}],"recipeIdeas":[]}. Include activities only for an actionable plan.\n`;task+=(payload.messages||[]).map(message=>`${message.role}: ${message.text}`).join('\n')}
  if(payload.mode==='summary')task='Give a brief weekly wellness pattern summary with two observations and one practical next step. Use plain text without Markdown symbols.';
  if(payload.mode==='meal')task='Analyze this meal photo. Give an estimated calorie range, estimated protein range in grams, and one or two short nutrition notes. Mention that photo estimates can be inaccurate. Use plain text without Markdown symbols.';
  if(payload.mode==='lab-consensus')task=`Compare three OCR readings of one lab report. Return JSON only: {"reportDate":"YYYY-MM-DD or null","summary":"brief consensus and conflicts","labs":[{"name":"test","value":"printed value","unit":"printed unit or empty","range":"printed range or empty"}]}. Include only labs whose name and numeric value agree in 2+ scans. Never infer, average, correct, or guess.\n${(payload.ocrScans||[]).map((text,index)=>`OCR ${index+1}:\n${text}`).join('\n\n')}`;
  if(payload.mode==='recipe-intent')task=`Interpret this natural-language recipe search. Return JSON only: {"terms":["up to four short recipe names or primary ingredients"],"tags":["up to four dietary or practical intent labels"]}. Search: ${String(payload.query||'').slice(0,300)}`;
  if(payload.mode==='recipe-analysis')task=`Analyze this recipe without inventing exact nutrition. Return JSON only: {"overview":"what it is","nutrition":"brief context","suitableFor":"who it may suit with caveats","difficulty":"Easy, Moderate, or Advanced","flavor":"profile","tips":["up to 3"],"substitutions":["up to 3"],"storage":"guidance","tags":["up to 5"]}. Recipe: ${JSON.stringify(payload.recipe||{})}`;
  return`${background}${task}`;
}
function parseDirectLab(text){try{const cleaned=String(text).replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();const parsed=JSON.parse(cleaned);return{text:String(parsed.summary||''),labs:Array.isArray(parsed.labs)?parsed.labs:[],reportDate:/^\d{4}-\d{2}-\d{2}$/.test(parsed.reportDate)?parsed.reportDate:null}}catch{throw new Error('The AI returned unreadable lab data. Nothing was saved. Please retry.')}}
function parseDirectChat(text){try{const cleaned=String(text).replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();const parsed=JSON.parse(cleaned);const activities=Array.isArray(parsed.activities)?parsed.activities.slice(0,5).map(item=>({title:String(item.title||'').trim().slice(0,100),duration:String(item.duration||'').trim().slice(0,80)})).filter(item=>item.title&&item.duration):[];const recipeIdeas=Array.isArray(parsed.recipeIdeas)?parsed.recipeIdeas.slice(0,2).map((recipe,index)=>({id:`ai-recipe-${Date.now().toString(36)}-${index}`,title:String(recipe.title||'').trim().slice(0,120),image:'',category:'AI recipe',area:'',overview:String(recipe.overview||'').trim(),ingredients:Array.isArray(recipe.ingredients)?recipe.ingredients.slice(0,15).map(item=>({name:String(item.name||'').trim(),measure:String(item.measure||'').trim()})).filter(item=>item.name):[],instructions:Array.isArray(recipe.instructions)?recipe.instructions.slice(0,10).map(String).filter(Boolean):[],prepTime:String(recipe.prepTime||''),cookTime:String(recipe.cookTime||''),totalTime:String(recipe.totalTime||''),servings:String(recipe.servings||''),calories:String(recipe.calories||''),protein:String(recipe.protein||''),difficulty:String(recipe.difficulty||'Moderate'),tags:Array.isArray(recipe.tags)?recipe.tags.slice(0,5).map(String):[],sourceUrl:'',generatedByAi:true})).filter(recipe=>recipe.title&&recipe.ingredients.length&&recipe.instructions.length):[];return{text:String(parsed.reply||'').replace(/\*\*/g,'').trim(),activities,recipeIdeas}}catch{return{text:String(text).replace(/\*\*/g,'').trim(),activities:[],recipeIdeas:[]}}}
function parseDirectRecipe(text,mode){try{const cleaned=String(text).replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();const parsed=JSON.parse(cleaned.slice(cleaned.indexOf('{'),cleaned.lastIndexOf('}')+1));if(mode==='recipe-intent')return{terms:Array.isArray(parsed.terms)?parsed.terms.slice(0,4).map(String):[],tags:Array.isArray(parsed.tags)?parsed.tags.slice(0,4).map(String):[]};return{overview:String(parsed.overview||''),nutrition:String(parsed.nutrition||''),suitableFor:String(parsed.suitableFor||''),difficulty:String(parsed.difficulty||'Moderate'),flavor:String(parsed.flavor||''),tips:Array.isArray(parsed.tips)?parsed.tips.slice(0,5).map(String):[],substitutions:Array.isArray(parsed.substitutions)?parsed.substitutions.slice(0,5).map(String):[],storage:String(parsed.storage||''),tags:Array.isArray(parsed.tags)?parsed.tags.slice(0,5).map(String):[]}}catch{throw new Error('The recipe response was unreadable. Please retry.')}}
async function callAiDirect(payload,config){
  const configured=String(config.provider||'openai').toLowerCase();const provider=payload.image?String(config.visionProvider||configured).toLowerCase():configured;const apiKey=payload.image&&provider!==configured?config.visionApiKey:config.apiKey;if(!apiKey)throw new Error(`Enter a ${provider} API key for this request.`);
  const prompt=directPrompt(payload);let response,text,model;
  let sources=[];
  const maxTokens=aiOutputBudget(payload);
  if(provider==='gemini'){model=config.geminiModel||'gemini-3.1-flash-lite';const parts=[{text:prompt}];if(payload.image){const [header,data]=payload.image.split(',');parts.push({inline_data:{mime_type:header.match(/data:(.*?);/)?.[1]||'image/jpeg',data}})}response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts}],generationConfig:{maxOutputTokens:maxTokens,thinkingConfig:{thinkingLevel:'minimal'}}})});const data=await response.json().catch(()=>({}));text=data.candidates?.[0]?.content?.parts?.map(part=>part.text||'').join('')||'';if(!response.ok)throw new Error(data.error?.message||'Gemini rejected the request.')}
  else{if(payload.image&&provider==='deepseek')throw new Error('DeepSeek does not support meal photos. Configure Gemini or OpenAI as the vision provider.');model=provider==='deepseek'?(config.deepseekModel||'deepseek-chat'):(config.openaiModel||'gpt-4o-mini');const content=payload.image?[{type:'text',text:prompt},{type:'image_url',image_url:{url:payload.image,detail:'low'}}]:prompt;const tokenLimit=provider==='deepseek'?{max_tokens:maxTokens}:{max_completion_tokens:maxTokens};response=await fetch(provider==='deepseek'?'https://api.deepseek.com/chat/completions':'https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`},body:JSON.stringify({model,messages:[{role:'user',content}],n:1,...tokenLimit})});const data=await response.json().catch(()=>({}));text=data.choices?.[0]?.message?.content||'';if(!response.ok)throw new Error(data.error?.message||`${provider} rejected the request.`)}
  if(!text)throw new Error('The AI returned no readable response. Please retry.');
  const result=payload.mode==='lab-consensus'?parseDirectLab(text):payload.mode==='chat'?parseDirectChat(text):payload.mode==='recipe-intent'||payload.mode==='recipe-analysis'?parseDirectRecipe(text,payload.mode):{text:String(text).replace(/\*\*/g,'').replace(/^#+\s*/gm,'').trim()};
  return{...result,sources,model,provider};
}
