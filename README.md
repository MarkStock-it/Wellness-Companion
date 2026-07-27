# Wellness Companion — AI Prototype

> **Scope change:** this project is no longer a visual-only wireframe. It is a
> working local-first prototype with a server-side OpenAI API proxy. It is not
> production-ready, clinically validated, or a medical device.

The app helps users track meals, activity, symptoms, and blood work. It includes
an optional AI helper, live wellness summaries, meal-photo estimates, and
lab-report extraction.

## Run locally

Run commands from this directory, not its parent:

```bash
cd "/Users/markelysalinas/Desktop/GIT - PORT/Wellnes Companion/Wellness-Companion"
cp .env.example .env.local
```

Choose an AI provider and add its key to `.env.local`:

```dotenv
AI_PROVIDER=deepseek
AI_VISION_PROVIDER=gemini

DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-v4-flash

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash
```

Supported routing:

- `openai`: chat, summaries, meal photos, and lab-report photos
- `gemini`: chat, summaries, meal photos, and lab-report photos
- `deepseek`: chat and summaries

DeepSeek's documented chat API currently accepts text message content. Configure
`AI_VISION_PROVIDER=gemini` or `openai` when DeepSeek is the main provider and
photo analysis is needed.

Then:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Data boundary

- Profile and wellness logs are stored in browser `localStorage`.
- The API key stays server-side and is never exposed to the browser.
- When an AI feature is used, the app sends the relevant profile/log context,
  question, or image to the configured provider for processing.
- Provider-side processing and retention follow the configured provider's API
  terms. OpenAI requests set `store: false`; this option does not apply to other
  providers.
- Users must explicitly acknowledge this boundary before AI features unlock.
- Chat history is held only in the current page session.

This disclaimer and the product's health-safety wording require legal and
clinical review before use with real patients.

## AI behavior and fallbacks

The server prompt requires short, plain-language output; uncertainty labels;
no diagnosis, treatment, dosage, or medication-change instructions; and care
team escalation for clinical decisions. The UI exposes clear retryable errors
for missing configuration, unsupported or oversized images, rate limits, empty
model output, and general provider failures.

Meal-photo estimates are intentionally limited to calories, protein, and one or
two notes. Lab extraction supports arbitrary named values and asks the model not
to infer unreadable or missing information.
