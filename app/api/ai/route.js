import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
const MAX_BODY_CHARS = 12_000_000;

const safety = `You are the Wellness Companion AI, an educational health-support assistant.
Use plain, calm language and short paragraphs. Never diagnose, recommend changing medication,
give treatment instructions, or claim visual/lab estimates are exact. Clearly label estimates
and uncertainty. Do not interpret a value as normal or abnormal without its unit and reference
range. Encourage the user's care team for clinical decisions. If the user mentions emergency
warning signs, advise immediate local emergency help. Keep answers under 180 words.`;

function outputText(data) {
  return (data.output || []).flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text').map((item) => item.text).join('\n').trim();
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
      instructions: safety, input: [{ role: 'user', content }],
    }),
  });
  const data = await response.json();
  return { response, data, text: response.ok ? outputText(data) : '' };
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
      generationConfig: { maxOutputTokens: 700 },
    }),
  });
  const data = await response.json();
  const text = response.ok ? (data.candidates?.[0]?.content?.parts || []).map(part => part.text || '').join('\n').trim() : '';
  return { response, data, text };
}

async function callDeepSeek({ key, model, prompt, identifier }) {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model, messages: [{ role: 'system', content: safety }, { role: 'user', content: prompt }],
      thinking: { type: 'disabled' }, max_tokens: 700, user_id: identifier,
    }),
  });
  const data = await response.json();
  const text = response.ok ? String(data.choices?.[0]?.message?.content || '').trim() : '';
  return { response, data, text };
}

export async function POST(request) {
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_CHARS) return NextResponse.json({ error: 'The uploaded image is too large. Choose an image under 8 MB.' }, { status: 413 });
    const body = JSON.parse(raw);
    const { mode, profile = {}, context = {}, messages = [], image } = body;
    if (!['chat', 'meal', 'lab', 'summary'].includes(mode)) return NextResponse.json({ error: 'Invalid AI request.' }, { status: 400 });
    if (image && !/^data:image\/(jpeg|png|webp);base64,/.test(image)) return NextResponse.json({ error: 'Please use a JPEG, PNG, or WebP image.' }, { status: 400 });
    const defaultProvider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
    const provider = image ? (process.env.AI_VISION_PROVIDER || defaultProvider).toLowerCase() : defaultProvider;
    if (!['openai', 'gemini', 'deepseek'].includes(provider)) return NextResponse.json({ error: `Unknown AI provider "${provider}".` }, { status: 503 });
    if (image && provider === 'deepseek') return NextResponse.json({ error: 'DeepSeek is configured for text only. Set AI_VISION_PROVIDER=gemini or openai for photo analysis.' }, { status: 503 });
    const settings = providerSettings(provider);
    if (!settings.key) return NextResponse.json({ error: `${provider[0].toUpperCase()+provider.slice(1)} is not configured. Add its API key to .env.local.` }, { status: 503 });

    const background = `Local profile and wellness log context supplied by the user:
${JSON.stringify({ profile, context }).slice(0, 24000)}`;
    let prompt = '';
    if (mode === 'chat') prompt = `Answer the latest question using relevant supplied context. Conversation:\n${messages.slice(-8).map(m => `${m.role}: ${m.text}`).join('\n')}`;
    if (mode === 'summary') prompt = 'Give a brief weekly wellness pattern summary with 2 observations and one gentle next step. Do not diagnose.';
    if (mode === 'meal') prompt = 'Analyze this meal photo. Return only: an estimated calorie range, estimated protein range in grams, and 1–2 short nutrition notes relevant to the profile. Mention that photo estimates can be inaccurate.';
    if (mode === 'lab') prompt = 'Extract every clearly readable lab test name, value, unit, and printed reference range from this report. Then explain the overall result in plain language. Mark unreadable or uncertain text. Do not infer missing values or diagnose.';
    const identifier = crypto.createHash('sha256').update(String(profile.localId || 'anonymous')).digest('hex').slice(0, 64);
    const args = { ...settings, prompt: `${background}\n\nTask:\n${prompt}`, image, identifier };
    const result = provider === 'openai' ? await callOpenAI(args) : provider === 'gemini' ? await callGemini(args) : await callDeepSeek(args);
    if (!result.response.ok) {
      console.error(`${provider} request failed`, result.response.status, result.data?.error?.code || result.data?.error?.status);
      return NextResponse.json({ error: result.response.status === 429 ? 'The AI service is busy. Please try again shortly.' : `${provider[0].toUpperCase()+provider.slice(1)} could not complete this request.` }, { status: 502 });
    }
    const text = result.text;
    if (!text) return NextResponse.json({ error: 'The AI returned no readable result. Please try again.' }, { status: 502 });
    return NextResponse.json({ text, model: settings.model, provider });
  } catch (error) {
    console.error('AI route error', error);
    return NextResponse.json({ error: 'Something went wrong while contacting the AI service.' }, { status: 500 });
  }
}
