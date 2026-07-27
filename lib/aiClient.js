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

export async function readFileAsDataUrl(file) {
  const original = await rawDataUrl(file);
  try {
    const image = new Image();
    const loaded = new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
    image.src = original;
    await loaded;
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.82);
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
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true') return callAiDirect(payload,config);
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, aiConfig: config }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reference = data.requestId ? ` Reference: ${data.requestId}.` : '';
    throw new Error(`${data.error || 'The AI service is unavailable right now.'}${reference}`);
  }
  return data;
}

function directPrompt(payload) {
  const background=`User-supplied local context:\n${JSON.stringify({profile:payload.profile||{},context:payload.context||{}}).slice(0,24000)}`;
  let task='';
  if(payload.mode==='chat')task=`Return JSON only: {"reply":"plain-language response","activities":[{"title":"short activity","duration":"duration or simple instruction"}],"recipeIdeas":[{"title":"recipe title","overview":"description","ingredients":[{"name":"ingredient","measure":"amount"}],"instructions":["concise step"],"prepTime":"estimate","cookTime":"estimate","totalTime":"estimate","servings":"number","calories":"labeled estimate or unavailable","protein":"labeled estimate or unavailable","difficulty":"Easy, Moderate, or Advanced","tags":["tags"]}]}. Include activities for actionable plans. Include 1–2 recipeIdeas when the user asks for a food or recipe. Respect nutrition targets, label estimates, use realistic portions, and do not say anything was saved. Otherwise use empty arrays.\n${(payload.messages||[]).slice(-8).map(message=>`${message.role}: ${message.text}`).join('\n')}`;
  if(payload.mode==='summary')task='Give a brief weekly wellness pattern summary with two observations and one practical next step. Use plain text without Markdown symbols.';
  if(payload.mode==='meal')task='Analyze this meal photo. Give an estimated calorie range, estimated protein range in grams, and one or two short nutrition notes. Mention that photo estimates can be inaccurate. Use plain text without Markdown symbols.';
  if(payload.mode==='lab-consensus')task=`Compare these three OCR readings of the same lab report. Return JSON only: {"reportDate":"YYYY-MM-DD or null","summary":"brief neutral explanation","labs":[{"name":"test name","value":"printed value","unit":"printed unit or empty string","range":"printed reference range or empty string"}]}. Include a lab only when at least two scans support the same name and value. Never invent values.\n${(payload.ocrScans||[]).slice(0,3).map((text,index)=>`OCR ${index+1}:\n${String(text).slice(0,8000)}`).join('\n\n')}`;
  if(payload.mode==='recipe-intent')task=`Interpret this natural-language recipe search. Return JSON only: {"terms":["up to four short recipe names or primary ingredients"],"tags":["up to four dietary or practical intent labels"]}. Search: ${String(payload.query||'').slice(0,300)}`;
  if(payload.mode==='recipe-analysis')task=`Analyze this normalized recipe. Search a few reputable web references when the provider supports it to verify techniques, common variations, nutrition context, and tips. Do not copy source prose or invent exact nutrition. Return JSON only: {"overview":"what it is","nutrition":"brief explanation","suitableFor":"who it may suit","difficulty":"Easy, Moderate, or Advanced","flavor":"flavor profile","tips":["tips"],"substitutions":["substitutions"],"storage":"storage guidance","tags":["short tags"]}. Recipe: ${JSON.stringify(payload.recipe||{}).slice(0,24000)}`;
  return`${background}\n\nTask:\n${task}`;
}
function parseDirectLab(text){try{const cleaned=String(text).replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();const parsed=JSON.parse(cleaned);return{text:String(parsed.summary||''),labs:Array.isArray(parsed.labs)?parsed.labs:[],reportDate:/^\d{4}-\d{2}-\d{2}$/.test(parsed.reportDate)?parsed.reportDate:null}}catch{throw new Error('The AI returned unreadable lab data. Nothing was saved. Please retry.')}}
function parseDirectChat(text){try{const cleaned=String(text).replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();const parsed=JSON.parse(cleaned);const activities=Array.isArray(parsed.activities)?parsed.activities.slice(0,5).map(item=>({title:String(item.title||'').trim().slice(0,100),duration:String(item.duration||'').trim().slice(0,80)})).filter(item=>item.title&&item.duration):[];const recipeIdeas=Array.isArray(parsed.recipeIdeas)?parsed.recipeIdeas.slice(0,2).map((recipe,index)=>({id:`ai-recipe-${Date.now().toString(36)}-${index}`,title:String(recipe.title||'').trim().slice(0,120),image:'',category:'AI recipe',area:'',overview:String(recipe.overview||'').trim(),ingredients:Array.isArray(recipe.ingredients)?recipe.ingredients.slice(0,15).map(item=>({name:String(item.name||'').trim(),measure:String(item.measure||'').trim()})).filter(item=>item.name):[],instructions:Array.isArray(recipe.instructions)?recipe.instructions.slice(0,10).map(String).filter(Boolean):[],prepTime:String(recipe.prepTime||''),cookTime:String(recipe.cookTime||''),totalTime:String(recipe.totalTime||''),servings:String(recipe.servings||''),calories:String(recipe.calories||''),protein:String(recipe.protein||''),difficulty:String(recipe.difficulty||'Moderate'),tags:Array.isArray(recipe.tags)?recipe.tags.slice(0,5).map(String):[],sourceUrl:'',generatedByAi:true})).filter(recipe=>recipe.title&&recipe.ingredients.length&&recipe.instructions.length):[];return{text:String(parsed.reply||'').replace(/\*\*/g,'').trim(),activities,recipeIdeas}}catch{return{text:String(text).replace(/\*\*/g,'').trim(),activities:[],recipeIdeas:[]}}}
function parseDirectRecipe(text,mode){try{const cleaned=String(text).replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();const parsed=JSON.parse(cleaned.slice(cleaned.indexOf('{'),cleaned.lastIndexOf('}')+1));if(mode==='recipe-intent')return{terms:Array.isArray(parsed.terms)?parsed.terms.slice(0,4).map(String):[],tags:Array.isArray(parsed.tags)?parsed.tags.slice(0,4).map(String):[]};return{overview:String(parsed.overview||''),nutrition:String(parsed.nutrition||''),suitableFor:String(parsed.suitableFor||''),difficulty:String(parsed.difficulty||'Moderate'),flavor:String(parsed.flavor||''),tips:Array.isArray(parsed.tips)?parsed.tips.slice(0,5).map(String):[],substitutions:Array.isArray(parsed.substitutions)?parsed.substitutions.slice(0,5).map(String):[],storage:String(parsed.storage||''),tags:Array.isArray(parsed.tags)?parsed.tags.slice(0,5).map(String):[]}}catch{throw new Error('The recipe response was unreadable. Please retry.')}}
async function callAiDirect(payload,config){
  const configured=String(config.provider||'openai').toLowerCase();const provider=payload.image?String(config.visionProvider||configured).toLowerCase():configured;const apiKey=payload.image&&provider!==configured?config.visionApiKey:config.apiKey;if(!apiKey)throw new Error(`Enter a ${provider} API key for this request.`);
  const prompt=directPrompt(payload);let response,text,model;
  let sources=[];
  if(provider==='gemini'){model=config.geminiModel||'gemini-3.1-flash-lite';const parts=[{text:prompt}];if(payload.image){const [header,data]=payload.image.split(',');parts.push({inline_data:{mime_type:header.match(/data:(.*?);/)?.[1]||'image/jpeg',data}})}response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts}],...(payload.mode==='recipe-analysis'?{tools:[{google_search:{}}]}:{}),generationConfig:{maxOutputTokens:2000}})});const data=await response.json().catch(()=>({}));text=data.candidates?.[0]?.content?.parts?.map(part=>part.text||'').join('')||'';sources=(data.candidates?.[0]?.groundingMetadata?.groundingChunks||[]).map(chunk=>chunk.web).filter(Boolean).slice(0,6);if(!response.ok)throw new Error(data.error?.message||'Gemini rejected the request.')}
  else{if(payload.image&&provider==='deepseek')throw new Error('DeepSeek does not support meal photos. Configure Gemini or OpenAI as the vision provider.');model=provider==='deepseek'?(config.deepseekModel||'deepseek-chat'):(config.openaiModel||'gpt-4o-mini');const content=payload.image?[{type:'text',text:prompt},{type:'image_url',image_url:{url:payload.image}}]:prompt;response=await fetch(provider==='deepseek'?'https://api.deepseek.com/chat/completions':'https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`},body:JSON.stringify({model,messages:[{role:'user',content}],max_tokens:1600})});const data=await response.json().catch(()=>({}));text=data.choices?.[0]?.message?.content||'';if(!response.ok)throw new Error(data.error?.message||`${provider} rejected the request.`)}
  if(!text)throw new Error('The AI returned no readable response. Please retry.');
  const result=payload.mode==='lab-consensus'?parseDirectLab(text):payload.mode==='chat'?parseDirectChat(text):payload.mode==='recipe-intent'||payload.mode==='recipe-analysis'?parseDirectRecipe(text,payload.mode):{text:String(text).replace(/\*\*/g,'').replace(/^#+\s*/gm,'').trim()};
  return{...result,sources,model,provider};
}
