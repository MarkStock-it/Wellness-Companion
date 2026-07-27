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
  if(payload.mode==='chat')task=`Answer the latest question using relevant context. Use plain text without Markdown symbols.\n${(payload.messages||[]).slice(-8).map(message=>`${message.role}: ${message.text}`).join('\n')}`;
  if(payload.mode==='summary')task='Give a brief weekly wellness pattern summary with two observations and one practical next step. Use plain text without Markdown symbols.';
  if(payload.mode==='meal')task='Analyze this meal photo. Give an estimated calorie range, estimated protein range in grams, and one or two short nutrition notes. Mention that photo estimates can be inaccurate. Use plain text without Markdown symbols.';
  if(payload.mode==='lab-consensus')task=`Compare these three OCR readings of the same lab report. Return JSON only: {"reportDate":"YYYY-MM-DD or null","summary":"brief neutral explanation","labs":[{"name":"test name","value":"printed value","unit":"printed unit or empty string","range":"printed reference range or empty string"}]}. Include a lab only when at least two scans support the same name and value. Never invent values.\n${(payload.ocrScans||[]).slice(0,3).map((text,index)=>`OCR ${index+1}:\n${String(text).slice(0,8000)}`).join('\n\n')}`;
  return`${background}\n\nTask:\n${task}`;
}
function parseDirectLab(text){try{const cleaned=String(text).replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();const parsed=JSON.parse(cleaned);return{text:String(parsed.summary||''),labs:Array.isArray(parsed.labs)?parsed.labs:[],reportDate:/^\d{4}-\d{2}-\d{2}$/.test(parsed.reportDate)?parsed.reportDate:null}}catch{throw new Error('The AI returned unreadable lab data. Nothing was saved. Please retry.')}}
async function callAiDirect(payload,config){
  const configured=String(config.provider||'openai').toLowerCase();const provider=payload.image?String(config.visionProvider||configured).toLowerCase():configured;const apiKey=payload.image&&provider!==configured?config.visionApiKey:config.apiKey;if(!apiKey)throw new Error(`Enter a ${provider} API key for this request.`);
  const prompt=directPrompt(payload);let response,text,model;
  if(provider==='gemini'){model=config.geminiModel||'gemini-2.0-flash';const parts=[{text:prompt}];if(payload.image){const [header,data]=payload.image.split(',');parts.push({inline_data:{mime_type:header.match(/data:(.*?);/)?.[1]||'image/jpeg',data}})}response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts}],generationConfig:{maxOutputTokens:1600}})});const data=await response.json().catch(()=>({}));text=data.candidates?.[0]?.content?.parts?.map(part=>part.text||'').join('')||'';if(!response.ok)throw new Error(data.error?.message||'Gemini rejected the request.')}
  else{if(payload.image&&provider==='deepseek')throw new Error('DeepSeek does not support meal photos. Configure Gemini or OpenAI as the vision provider.');model=provider==='deepseek'?(config.deepseekModel||'deepseek-chat'):(config.openaiModel||'gpt-4o-mini');const content=payload.image?[{type:'text',text:prompt},{type:'image_url',image_url:{url:payload.image}}]:prompt;response=await fetch(provider==='deepseek'?'https://api.deepseek.com/chat/completions':'https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`},body:JSON.stringify({model,messages:[{role:'user',content}],max_tokens:1600})});const data=await response.json().catch(()=>({}));text=data.choices?.[0]?.message?.content||'';if(!response.ok)throw new Error(data.error?.message||`${provider} rejected the request.`)}
  if(!text)throw new Error('The AI returned no readable response. Please retry.');
  const result=payload.mode==='lab-consensus'?parseDirectLab(text):{text:String(text).replace(/\*\*/g,'').replace(/^#+\s*/gm,'').trim()};
  return{...result,model,provider};
}
