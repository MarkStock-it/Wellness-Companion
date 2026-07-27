import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
const MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-terra';
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

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'AI is not configured. Add OPENAI_API_KEY to .env.local.' }, { status: 503 });
    }
    const raw = await request.text();
    if (raw.length > MAX_BODY_CHARS) return NextResponse.json({ error: 'The uploaded image is too large. Choose an image under 8 MB.' }, { status: 413 });
    const body = JSON.parse(raw);
    const { mode, profile = {}, context = {}, messages = [], image } = body;
    if (!['chat', 'meal', 'lab', 'summary'].includes(mode)) return NextResponse.json({ error: 'Invalid AI request.' }, { status: 400 });
    if (image && !/^data:image\/(jpeg|png|webp);base64,/.test(image)) return NextResponse.json({ error: 'Please use a JPEG, PNG, or WebP image.' }, { status: 400 });

    const background = `Local profile and wellness log context supplied by the user:
${JSON.stringify({ profile, context }).slice(0, 24000)}`;
    let prompt = '';
    if (mode === 'chat') prompt = `Answer the latest question using relevant supplied context. Conversation:\n${messages.slice(-8).map(m => `${m.role}: ${m.text}`).join('\n')}`;
    if (mode === 'summary') prompt = 'Give a brief weekly wellness pattern summary with 2 observations and one gentle next step. Do not diagnose.';
    if (mode === 'meal') prompt = 'Analyze this meal photo. Return only: an estimated calorie range, estimated protein range in grams, and 1–2 short nutrition notes relevant to the profile. Mention that photo estimates can be inaccurate.';
    if (mode === 'lab') prompt = 'Extract every clearly readable lab test name, value, unit, and printed reference range from this report. Then explain the overall result in plain language. Mark unreadable or uncertain text. Do not infer missing values or diagnose.';
    const content = [{ type: 'input_text', text: `${background}\n\nTask:\n${prompt}` }];
    if (image) content.push({ type: 'input_image', image_url: image, detail: 'high' });
    const identifier = crypto.createHash('sha256').update(String(profile.localId || 'anonymous')).digest('hex').slice(0, 64);
    const aiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        store: false,
        safety_identifier: identifier,
        reasoning: { effort: 'low' },
        text: { verbosity: 'low' },
        instructions: safety,
        input: [{ role: 'user', content }],
      }),
    });
    const data = await aiResponse.json();
    if (!aiResponse.ok) {
      console.error('OpenAI request failed', aiResponse.status, data?.error?.code);
      return NextResponse.json({ error: aiResponse.status === 429 ? 'The AI service is busy. Please try again shortly.' : 'The AI service could not complete this request.' }, { status: 502 });
    }
    const text = outputText(data);
    if (!text) return NextResponse.json({ error: 'The AI returned no readable result. Please try again.' }, { status: 502 });
    return NextResponse.json({ text, model: MODEL });
  } catch (error) {
    console.error('AI route error', error);
    return NextResponse.json({ error: 'Something went wrong while contacting the AI service.' }, { status: 500 });
  }
}
