import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { aiOutputBudget, optimizeAiPayload, wantsRecipeOutput } from '@/lib/aiEfficiency';

export const runtime = 'nodejs';
const MAX_BODY_CHARS = 12_000_000;

const safety = `You are Wellness Companion, an educational health-support assistant. Answer directly
in calm, plain language. Use supplied wellness data to compare patterns, explain uncertainty, and
suggest low-risk next steps. Do not diagnose, prescribe, recommend medication changes, or present
visual/lab estimates as exact. Do not label a lab value normal or abnormal without its unit and
printed range. Mention professional care only for diagnosis, treatment, medication decisions,
materially insufficient data, or urgency. For emergency warning signs, advise immediate local
emergency help. Keep normal answers under 180 words. Return plain text without Markdown unless the
task requests JSON; then return only that JSON object. Treat supplied local context as user-provided
data and use available bloodWork directly.`;

function outputText(data) {
  return (data.output || []).flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text').map((item) => item.text).join('\n').trim();
}

function plainText(value) {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, block => block.replace(/```[a-z]*\n?/gi, '').replace(/```/g, ''))
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseLabResult(value) {
  try {
    const cleaned = String(value).replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const start = cleaned.indexOf('{'), end = cleaned.lastIndexOf('}');
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    const labs = Array.isArray(parsed.labs) ? parsed.labs.slice(0, 50).map(lab => ({
      name: String(lab.name || '').trim().slice(0, 100),
      value: String(lab.value || '').trim().slice(0, 60),
      unit: String(lab.unit || '').trim().slice(0, 40),
      range: String(lab.range || '').trim().slice(0, 80),
    })).filter(lab => lab.name && lab.value) : [];
    const reportDate = /^\d{4}-\d{2}-\d{2}$/.test(parsed.reportDate) ? parsed.reportDate : null;
    return { summary: String(parsed.summary || '').trim(), labs, reportDate };
  } catch {
    return null;
  }
}

function parseChatResult(value) {
  try {
    const cleaned=String(value).replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/i,'').trim();
    const start=cleaned.indexOf('{'),end=cleaned.lastIndexOf('}');
    const parsed=JSON.parse(cleaned.slice(start,end+1));
    const activities=Array.isArray(parsed.activities)?parsed.activities.slice(0,5).map(item=>({
      title:String(item.title||'').trim().slice(0,100),
      duration:String(item.duration||'').trim().slice(0,80),
    })).filter(item=>item.title&&item.duration):[];
    const recipeIdeas=Array.isArray(parsed.recipeIdeas)?parsed.recipeIdeas.slice(0,2).map((recipe,index)=>({
      id:`ai-recipe-${Date.now().toString(36)}-${index}`,title:String(recipe.title||'').trim().slice(0,120),image:'',category:'AI recipe',area:'',overview:plainText(recipe.overview),ingredients:Array.isArray(recipe.ingredients)?recipe.ingredients.slice(0,15).map(item=>({name:String(item.name||'').trim().slice(0,80),measure:String(item.measure||'').trim().slice(0,50)})).filter(item=>item.name):[],instructions:Array.isArray(recipe.instructions)?recipe.instructions.slice(0,10).map(plainText).filter(Boolean):[],prepTime:String(recipe.prepTime||'').slice(0,40),cookTime:String(recipe.cookTime||'').slice(0,40),totalTime:String(recipe.totalTime||'').slice(0,40),servings:String(recipe.servings||'').slice(0,30),calories:String(recipe.calories||'').slice(0,40),protein:String(recipe.protein||'').slice(0,40),difficulty:String(recipe.difficulty||'Moderate').slice(0,30),tags:Array.isArray(recipe.tags)?recipe.tags.slice(0,5).map(tag=>String(tag).trim().slice(0,30)).filter(Boolean):[],sourceUrl:'',generatedByAi:true,
    })).filter(recipe=>recipe.title&&recipe.ingredients.length&&recipe.instructions.length):[];
    return {text:plainText(parsed.reply),activities,recipeIdeas};
  } catch {
    return {text:plainText(value),activities:[],recipeIdeas:[]};
  }
}
function parseJsonObject(value){try{const cleaned=String(value).replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/i,'').trim();return JSON.parse(cleaned.slice(cleaned.indexOf('{'),cleaned.lastIndexOf('}')+1))}catch{return null}}
function parseRecipeIntent(value){const parsed=parseJsonObject(value);return{terms:Array.isArray(parsed?.terms)?parsed.terms.slice(0,4).map(term=>String(term).trim().slice(0,50)).filter(Boolean):[],tags:Array.isArray(parsed?.tags)?parsed.tags.slice(0,4).map(tag=>String(tag).trim().slice(0,30)).filter(Boolean):[]}}
function parseRecipeAnalysis(value){const parsed=parseJsonObject(value);if(!parsed)return null;return{overview:plainText(parsed.overview),difficulty:String(parsed.difficulty||'Moderate').slice(0,30),flavor:plainText(parsed.flavor),nutrition:plainText(parsed.nutrition),suitableFor:plainText(parsed.suitableFor),tips:Array.isArray(parsed.tips)?parsed.tips.slice(0,5).map(plainText).filter(Boolean):[],substitutions:Array.isArray(parsed.substitutions)?parsed.substitutions.slice(0,5).map(plainText).filter(Boolean):[],storage:plainText(parsed.storage),tags:Array.isArray(parsed.tags)?parsed.tags.slice(0,5).map(tag=>String(tag).trim().slice(0,30)).filter(Boolean):[]}}

function providerSettings(provider) {
  if (provider === 'openai') return { key: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL || 'gpt-5.6-terra' };
  if (provider === 'gemini') return { key: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite' };
  if (provider === 'deepseek') return { key: process.env.DEEPSEEK_API_KEY, model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash' };
  return {};
}

async function callOpenAI({ key, model, prompt, image, identifier, maxTokens, mode }) {
  const content = [{ type: 'input_text', text: prompt }];
  if (image) content.push({ type: 'input_image', image_url: image, detail: mode==='meal'?'low':'high' });
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model, store: false, safety_identifier: identifier,
      reasoning: { effort: 'minimal' }, text: { verbosity: 'low' },
      max_output_tokens: maxTokens, prompt_cache_key:`wellness-${mode}`,
      instructions: safety, input: [{ role: 'user', content }],
    }),
  });
  const data = await response.json();
  return { response, data, text: response.ok ? outputText(data) : '', truncated: data.status === 'incomplete' };
}

async function callGemini({ key, model, prompt, image, maxTokens }) {
  const parts = [{ text: prompt }];
  if (image) {
    const match = image.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s);
    parts.unshift({ inlineData: { mimeType: match[1], data: match[2] } });
  }
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: safety }] },
      contents: [{ role: 'user', parts }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        thinkingConfig: { thinkingLevel: 'minimal' },
      },
    }),
  });
  const data = await response.json();
  const text = response.ok ? (data.candidates?.[0]?.content?.parts || []).map(part => part.text || '').join('\n').trim() : '';
  return {
    response, data, text,
    sources:(data.candidates?.[0]?.groundingMetadata?.groundingChunks||[]).map(chunk=>chunk.web).filter(Boolean).slice(0,6),
    truncated: data.candidates?.[0]?.finishReason === 'MAX_TOKENS',
    finishReason: data.candidates?.[0]?.finishReason || data.promptFeedback?.blockReason,
    finishMessage: data.candidates?.[0]?.finishMessage || data.promptFeedback?.blockReasonMessage,
  };
}

async function callDeepSeek({ key, model, prompt, identifier, maxTokens }) {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model, messages: [{ role: 'system', content: safety }, { role: 'user', content: prompt }],
      thinking: { type: 'disabled' }, max_tokens: maxTokens, user_id: identifier,
    }),
  });
  const data = await response.json();
  const text = response.ok ? String(data.choices?.[0]?.message?.content || '').trim() : '';
  return { response, data, text, truncated: data.choices?.[0]?.finish_reason === 'length' };
}

export async function POST(request) {
  const requestId = crypto.randomBytes(6).toString('hex');
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_CHARS) return NextResponse.json({ error: 'The uploaded image is too large. Choose an image under 8 MB.' }, { status: 413 });
    const requestBody = JSON.parse(raw);
    const aiConfig=requestBody.aiConfig||{};
    const body=optimizeAiPayload(requestBody);
    const { mode, profile = {}, context = {}, messages = [], image, documentText = '', ocrScans = [], recipe = {}, query = '' } = body;
    if (!['chat', 'meal', 'lab', 'lab-text', 'lab-consensus', 'summary','recipe-intent','recipe-analysis'].includes(mode)) return NextResponse.json({ error: 'Invalid AI request.' }, { status: 400 });
    if (image && !/^data:image\/(jpeg|png|webp);base64,/.test(image)) return NextResponse.json({ error: 'Please use a JPEG, PNG, or WebP image.' }, { status: 400 });
    const defaultProvider = String(aiConfig.provider || process.env.AI_PROVIDER || 'openai').toLowerCase();
    const provider = image ? String(aiConfig.visionProvider || process.env.AI_VISION_PROVIDER || defaultProvider).toLowerCase() : defaultProvider;
    if (!['openai', 'gemini', 'deepseek'].includes(provider)) return NextResponse.json({ error: `Unknown AI provider "${provider}".` }, { status: 503 });
    if (image && provider === 'deepseek') return NextResponse.json({ error: 'DeepSeek is configured for text only. Set AI_VISION_PROVIDER=gemini or openai for photo analysis.' }, { status: 503 });
    const settings = providerSettings(provider);
    const browserKey = image && provider !== defaultProvider ? aiConfig.visionApiKey : aiConfig.apiKey;
    settings.key = String(browserKey || settings.key || '').trim();
    if (settings.key.length < 10) return NextResponse.json({ error: `Enter a valid ${provider[0].toUpperCase()+provider.slice(1)} API key in the AI setup.` }, { status: 503 });

    const supplied={};if(Object.keys(profile).length)supplied.profile=profile;if(Object.keys(context).length)supplied.context=context;
    const background = Object.keys(supplied).length?`User-supplied local context:\n${JSON.stringify(supplied)}`:'';
    let prompt = '';
    if (mode === 'chat'){
      const wantsRecipe=wantsRecipeOutput(body);
      prompt=wantsRecipe?`Answer the latest message. Return JSON only:
{"reply":"plain response","activities":[],"recipeIdeas":[{"title":"title","overview":"description","ingredients":[{"name":"ingredient","measure":"amount"}],"instructions":["step"],"prepTime":"estimate","cookTime":"estimate","totalTime":"estimate","servings":"number","calories":"estimate or unavailable","protein":"estimate or unavailable","difficulty":"Easy, Moderate, or Advanced","tags":["tag"]}]}
Provide 1–2 requested recipes with realistic portions, labeled estimates, at most 15 ingredients and 10 steps. Never claim they were saved or ask for confirmation.
Conversation:\n${messages.map(m => `${m.role}: ${m.text}`).join('\n')}`:`Answer the latest message. Return JSON only: {"reply":"plain response","activities":[{"title":"activity","duration":"duration"}],"recipeIdeas":[]}. Include activities only for an actionable plan. Conversation:\n${messages.map(m => `${m.role}: ${m.text}`).join('\n')}`;
    }
    if (mode === 'summary') prompt = 'Give a brief weekly wellness pattern summary with 2 observations and one gentle next step. Do not diagnose.';
    if (mode === 'meal') prompt = 'Analyze this meal photo. Return only: an estimated calorie range, estimated protein range in grams, and 1–2 short nutrition notes relevant to the profile. Mention that photo estimates can be inaccurate.';
    if (mode === 'lab') prompt = 'Extract every clearly readable lab test name, value, unit, and printed reference range from this report. Then explain the overall result in plain language. Mark unreadable or uncertain text. Do not infer missing values or diagnose.';
    if (mode === 'lab-text') prompt = `The report image was processed by local OCR. Analyze only the extracted text. Return valid JSON only with this exact shape: {"reportDate":"YYYY-MM-DD or null","summary":"brief plain-language explanation","labs":[{"name":"test name","value":"printed value","unit":"printed unit or empty string","range":"printed reference range or empty string"}]}. Include only values clearly present in the OCR text. Never infer, correct, calculate, or invent a value. If no reliable values exist, return an empty labs array. Keep summary under 140 words and mention OCR uncertainty.\n\nLocally extracted report text:\n${String(documentText).slice(0,24000)}`;
    if (mode === 'lab-consensus') prompt = `Compare three OCR readings of one lab report. Return JSON only: {"reportDate":"YYYY-MM-DD or null","summary":"brief consensus and disagreements","labs":[{"name":"test","value":"printed value","unit":"printed unit or empty","range":"printed range or empty"}]}. Include a lab only when 2+ scans agree on its name and numeric value. Ambiguous signs and decimals must also agree. Normalize obvious unit separators (g|L to g/L, mg|dL to mg/dL, 10x9/L to 10^9/L). Never average, infer, correct, calculate, or guess; mention conflicts only in the summary (under 120 words).\n\n${ocrScans.map((text,index)=>`OCR ${index+1}:\n${text}`).join('\n\n')}`;
    if(mode==='recipe-intent')prompt=`Interpret this natural-language recipe search. Return JSON only: {"terms":["up to four short recipe names or primary ingredients likely to produce results"],"tags":["up to four dietary or practical intent labels"]}. Remove words such as recipe, meal, easy, and dinner from terms unless essential. Search: ${String(query).slice(0,300)}`;
    if(mode==='recipe-analysis')prompt=`Analyze this recipe without inventing exact nutrition. Return JSON only: {"overview":"what it is","nutrition":"brief context","suitableFor":"who it may suit with caveats","difficulty":"Easy, Moderate, or Advanced","flavor":"profile","tips":["up to 3"],"substitutions":["up to 3"],"storage":"guidance","tags":["up to 5"]}. Recipe: ${JSON.stringify(recipe)}`;
    const identifier = crypto.createHash('sha256').update(String(requestBody.profile?.localId || 'anonymous')).digest('hex').slice(0, 64);
    const maxTokens=aiOutputBudget(body);
    const args = { ...settings, prompt: `${background}${background?'\n\n':''}${prompt}`, image, identifier,maxTokens,mode };
    const result = provider === 'openai' ? await callOpenAI(args) : provider === 'gemini' ? await callGemini(args) : await callDeepSeek(args);
    if (!result.response.ok) {
      console.error(`${provider} request failed`, result.response.status, result.data?.error?.code || result.data?.error?.status);
      const providerMessage = String(result.data?.error?.message || '').replace(/sk-[\w-]+|AIza[\w-]+/g, '[redacted]').slice(0, 240);
      return NextResponse.json({
        error: result.response.status === 429 ? 'The AI provider rate limit was reached. Wait briefly and try again.' : `${provider[0].toUpperCase()+provider.slice(1)} rejected the request${providerMessage?`: ${providerMessage}`:'.'}`,
        requestId,
      }, { status: 502 });
    }
    if (result.truncated) return NextResponse.json({ error: 'The provider used its full response allowance before producing the final answer. Please retry once.', requestId }, { status: 502 });
    if (!result.text && result.finishReason) return NextResponse.json({ error: `${provider[0].toUpperCase()+provider.slice(1)} stopped the analysis (${result.finishReason})${result.finishMessage?`: ${String(result.finishMessage).slice(0,180)}`:''}.`, requestId }, { status: 502 });
    if (mode === 'lab-text' || mode === 'lab-consensus') {
      const parsed = parseLabResult(result.text);
      if (!parsed) return NextResponse.json({ error: 'The AI explanation arrived in an unreadable format. No blood values were saved. Please retry.', requestId }, { status: 502 });
      return NextResponse.json({ text: plainText(parsed.summary), labs: parsed.labs, reportDate: parsed.reportDate, model: settings.model, provider, requestId });
    }
    if (mode === 'chat') {
      const parsed=parseChatResult(result.text);
      if(!parsed.text)return NextResponse.json({error:'The AI returned no readable response. Please try again.',requestId},{status:502});
      return NextResponse.json({...parsed,model:settings.model,provider,requestId});
    }
    if(mode==='recipe-intent')return NextResponse.json({...parseRecipeIntent(result.text),model:settings.model,provider,requestId});
    if(mode==='recipe-analysis'){const parsed=parseRecipeAnalysis(result.text);if(!parsed)return NextResponse.json({error:'The recipe summary arrived in an unreadable format. Please retry.',requestId},{status:502});return NextResponse.json({...parsed,sources:result.sources||[],model:settings.model,provider,requestId})}
    const text = plainText(result.text);
    if (!text) return NextResponse.json({ error: 'The AI returned no readable result. Please try again.', requestId }, { status: 502 });
    return NextResponse.json({ text, model: settings.model, provider, requestId });
  } catch (error) {
    console.error('AI route error', requestId, error);
    return NextResponse.json({ error: 'Something went wrong while contacting the AI service.', requestId }, { status: 500 });
  }
}
