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

By default, the app asks the user to choose a provider and paste an API key
before the first AI request. The key is stored in browser `sessionStorage` and
is removed when that tab is closed.

For a private, server-managed installation, `.env.local` can provide an
optional fallback:

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
- User-provided API keys are held in browser `sessionStorage`, sent transiently
  through `/api/ai`, and are never written to the app's server storage or logs.
- Browser-held keys are not appropriate for an untrusted public production
  environment; use short-lived tokens or server-managed credentials there.
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
two notes. Lab-report photos are processed first by a lazily loaded, browser-side
Tesseract OCR worker. Only the extracted text is submitted to the AI provider,
reducing multimodal token usage and keeping the report image on-device. The
first scan may download OCR runtime/language assets. Low-text scans stop before
an AI call, and extracted text is shown for user verification.
