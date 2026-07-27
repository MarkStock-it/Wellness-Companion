import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
const MAX_BODY_CHARS = 12_000_000;

const safety = `You are the Wellness Companion AI, an educational health-support assistant.
Your purpose is to help the user think clearly about patterns in their own wellness data.
Answer directly. Compare entries, identify changes over time, explain common meanings, surface
uncertainties, and suggest useful questions or low-risk next steps. Do not begin or end with a
generic disclaimer. Do not repeatedly say to ask a professional or that you cannot give medical
advice. Mention professional care only when the user requests a diagnosis, treatment or medication
decision, the supplied data is insufficient for a material conclusion, or the situation may be urgent.
Use plain, calm language and short paragraphs. Do not diagnose, recommend changing medication,
give treatment instructions, or claim visual/lab estimates are exact. Clearly label estimates and
uncertainty. A lab value without its unit or printed reference range may still be described and
compared over time, but do not label it normal or abnormal. If the user mentions emergency warning
signs, advise immediate local emergency help. Keep answers under 180 words.
Return plain text only. Do not use Markdown, asterisks, headings, backticks, numbered lists,
bullet symbols, tables, or decorative formatting. Use short sentences and blank lines instead.
The request includes a section labeled local profile and wellness log context. Treat that supplied
context as data the user has explicitly shared with you for this response. When bloodWork contains
entries, summarize those entries directly and do not claim you cannot access them.`;

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

function providerSettings(provider) {
  if (provider === 'openai') return { key: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL || 'gpt-5.6-terra' };
  if (provider === 'gemini') return { key: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || 'gemini-3.6-flash' };
  if (provider === 'deepseek') return { key: process.env.DEEPSEEK_API_KEY, model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash' };
  return {};
}

async function callOpenAI({ key, model, prompt, image, identifier }) {
  const content = [{ type: 'input_text', text: prompt }];
  if (image) content.push({ type: 'input_image', image_url: image, detail: 'high' });
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model, store: false, safety_identifier: identifier,
      reasoning: { effort: 'low' }, text: { verbosity: 'low' },
      max_output_tokens: 1600,
      instructions: safety, input: [{ role: 'user', content }],
    }),
  });
  const data = await response.json();
  return { response, data, text: response.ok ? outputText(data) : '', truncated: data.status === 'incomplete' };
}

async function callGemini({ key, model, prompt, image }) {
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
        maxOutputTokens: 4096,
        thinkingConfig: { thinkingLevel: 'minimal' },
      },
    }),
  });
  const data = await response.json();
  const text = response.ok ? (data.candidates?.[0]?.content?.parts || []).map(part => part.text || '').join('\n').trim() : '';
  return {
    response, data, text,
    truncated: data.candidates?.[0]?.finishReason === 'MAX_TOKENS',
    finishReason: data.candidates?.[0]?.finishReason || data.promptFeedback?.blockReason,
    finishMessage: data.candidates?.[0]?.finishMessage || data.promptFeedback?.blockReasonMessage,
  };
}

async function callDeepSeek({ key, model, prompt, identifier }) {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model, messages: [{ role: 'system', content: safety }, { role: 'user', content: prompt }],
      thinking: { type: 'disabled' }, max_tokens: 1400, user_id: identifier,
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
    const body = JSON.parse(raw);
    const { mode, profile = {}, context = {}, messages = [], image, documentText = '', ocrScans = [], aiConfig = {} } = body;
    if (!['chat', 'meal', 'lab', 'lab-text', 'lab-consensus', 'summary'].includes(mode)) return NextResponse.json({ error: 'Invalid AI request.' }, { status: 400 });
    if (image && !/^data:image\/(jpeg|png|webp);base64,/.test(image)) return NextResponse.json({ error: 'Please use a JPEG, PNG, or WebP image.' }, { status: 400 });
    const defaultProvider = String(aiConfig.provider || process.env.AI_PROVIDER || 'openai').toLowerCase();
    const provider = image ? String(aiConfig.visionProvider || process.env.AI_VISION_PROVIDER || defaultProvider).toLowerCase() : defaultProvider;
    if (!['openai', 'gemini', 'deepseek'].includes(provider)) return NextResponse.json({ error: `Unknown AI provider "${provider}".` }, { status: 503 });
    if (image && provider === 'deepseek') return NextResponse.json({ error: 'DeepSeek is configured for text only. Set AI_VISION_PROVIDER=gemini or openai for photo analysis.' }, { status: 503 });
    const settings = providerSettings(provider);
    const browserKey = image && provider !== defaultProvider ? aiConfig.visionApiKey : aiConfig.apiKey;
    settings.key = String(browserKey || settings.key || '').trim();
    if (settings.key.length < 10) return NextResponse.json({ error: `Enter a valid ${provider[0].toUpperCase()+provider.slice(1)} API key in the AI setup.` }, { status: 503 });

    const background = `Local profile and wellness log context supplied by the user:
${JSON.stringify({ profile, context }).slice(0, 24000)}`;
    let prompt = '';
    if (mode === 'chat') prompt = `Answer the latest question using relevant supplied context. Conversation:\n${messages.slice(-8).map(m => `${m.role}: ${m.text}`).join('\n')}`;
    if (mode === 'summary') prompt = 'Give a brief weekly wellness pattern summary with 2 observations and one gentle next step. Do not diagnose.';
    if (mode === 'meal') prompt = 'Analyze this meal photo. Return only: an estimated calorie range, estimated protein range in grams, and 1–2 short nutrition notes relevant to the profile. Mention that photo estimates can be inaccurate.';
    if (mode === 'lab') prompt = 'Extract every clearly readable lab test name, value, unit, and printed reference range from this report. Then explain the overall result in plain language. Mark unreadable or uncertain text. Do not infer missing values or diagnose.';
    if (mode === 'lab-text') prompt = `The report image was processed by local OCR. Analyze only the extracted text. Return valid JSON only with this exact shape: {"reportDate":"YYYY-MM-DD or null","summary":"brief plain-language explanation","labs":[{"name":"test name","value":"printed value","unit":"printed unit or empty string","range":"printed reference range or empty string"}]}. Include only values clearly present in the OCR text. Never infer, correct, calculate, or invent a value. If no reliable values exist, return an empty labs array. Keep summary under 140 words and mention OCR uncertainty.\n\nLocally extracted report text:\n${String(documentText).slice(0,24000)}`;
    if (mode === 'lab-consensus') prompt = `The same lab report was photographed and OCR-scanned locally three times. Compare the three OCR texts. Return valid JSON only with this exact shape: {"reportDate":"YYYY-MM-DD or null","summary":"brief plain-language consensus explanation that flags disagreements","labs":[{"name":"test name","value":"printed value","unit":"printed unit or empty string","range":"printed reference range or empty string"}]}. Save a lab only when at least two scans support the same test name and numeric value. For units, recognize only conservative visual OCR equivalents in standard lab-unit patterns, such as g|L or g\\L meaning g/L, mg|dL meaning mg/dL, and 10x9/L meaning 10^9/L. A tilde, inequality sign, decimal separator, plus/minus sign, or other ambiguous symbol must agree in at least two scans; never guess it. Do not average values or choose a closest number when scans conflict. Never infer, correct, calculate, or invent information. Put uncertain or conflicting readings only in the summary, not in labs. Keep the summary under 160 words.\n\n${ocrScans.slice(0,3).map((text,index)=>`OCR SCAN ${index+1}:\n${String(text).slice(0,8000)}`).join('\n\n')}`;
    const identifier = crypto.createHash('sha256').update(String(profile.localId || 'anonymous')).digest('hex').slice(0, 64);
    const args = { ...settings, prompt: `${background}\n\nTask:\n${prompt}`, image, identifier };
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
    const text = plainText(result.text);
    if (!text) return NextResponse.json({ error: 'The AI returned no readable result. Please try again.', requestId }, { status: 502 });
    return NextResponse.json({ text, model: settings.model, provider, requestId });
  } catch (error) {
    console.error('AI route error', requestId, error);
    return NextResponse.json({ error: 'Something went wrong while contacting the AI service.', requestId }, { status: 500 });
  }
}
