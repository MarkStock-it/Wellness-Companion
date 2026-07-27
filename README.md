# Wellness Companion — Wireframe (Visual Prototype Only)

A Next.js + React + Tailwind wireframe for a cancer-nutrition and wellness
companion app, designed to be easy for older adults to use. **This is a
structural/visual prototype only** — there is no backend, no database, no
real API calls, and no data persistence. All content is placeholder data.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Best viewed at a phone width (this is
mobile-first); resize your browser down to ~390px or use dev-tools device mode.

## Screens

| Screen | Route | Reached via |
|---|---|---|
| Home / Dashboard | `/` | Bottom nav |
| Meal Log | `/meals` | Bottom nav |
| Blood Work Tracker | `/blood-work` | Bottom nav |
| Activity / Movement | `/activity` | Bottom nav |
| More (hub) | `/more` | Bottom nav |
| Meal Ideas Library | `/meal-ideas` | via More |
| Symptom Check-in | `/symptoms` | via More |
| AI Health Summary | `/ai-summary` | via More |
| Resources / Talk to a Professional | `/resources` | via More |

The bottom nav intentionally stays at 5 items (Home, Meals, Blood Work,
Activity, More) per the elderly-friendly brief — the four remaining screens
live one tap deep behind "More" rather than crowding the nav bar, but
navigation is otherwise always one tap from anywhere.

## Structure

```
app/
  layout.js         — shared shell + bottom nav, PWA-style metadata
  globals.css        — base type size (18px+), focus states, reduced motion
  page.js            — Home / Dashboard
  meals/page.js
  blood-work/page.js
  activity/page.js
  more/page.js
  meal-ideas/page.js
  symptoms/page.js
  ai-summary/page.js
  resources/page.js
components/
  BottomNav.js       — fixed, consistent nav bar (icon + text label)
  PageHeader.js       — consistent title/back-button placement
  Card.js             — shared card container
  BigButton.js        — shared 48px+ tap-target button
```

Everything is a plain, unstyled placeholder underneath the visuals — the
component boundaries are drawn so real logic can be dropped in later without
restructuring the UI.

## Design rationale (tokens)

- **Colors** (`tailwind.config.js`): warm off-white background (`canvas`),
  warm near-black text (`ink`, not gray, for contrast), one confident teal
  accent for primary actions, a warm clay/gold used sparingly for secondary
  emphasis. No cold clinical blues, no low-contrast grays.
- **Type**: minimum 18px body text site-wide (`html { font-size: 18px }`),
  headings scale up to 32px, a serif display face for headings to feel warm
  and readable rather than clinical, plain-language labels everywhere.
- **Touch targets**: every interactive element uses `min-h-touch`/`min-w-touch`
  (48px) via the Tailwind theme.
- **Motion**: no page-transition animation; the only animation is a simple
  loading spinner on the AI Summary screen, and `prefers-reduced-motion` is
  respected globally in `globals.css`.
- **Navigation**: the bottom nav is rendered once in `app/layout.js`, so its
  position and items never change between screens.

## Open decisions left for the implementation phase

These are intentionally left as `// TODO` comments in the code, not resolved
here:

- **Data sources** for meals, blood work, activity, and symptoms (manual
  entry vs. imports, e.g. from a lab portal or wearable).
- **Backend / API-key handling** — any real API calls (especially to an AI
  summary provider) should be made from a server route, never the client.
- **AI output tone & safety guardrails** — wording rules, what the model is
  and isn't allowed to say (no diagnosis, no dosage/treatment advice), and
  how the "not medical advice" disclaimer is enforced at the API level, not
  just in the UI text.
- **Photo capture / food recognition** for the Meal Log's "Take Photo" button.
- **Nutrition support directory** for the Resources screen's "Find Free/
  Low-Cost Nutrition Support" button.
