'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import BigButton from '@/components/BigButton';
import Icon from '@/components/Icon';

// Prototype summary copy. A production release should connect this to a guarded server API.
// TODO (implementation phase, open decisions):
//  - Which data sources feed the summary (meals, blood work, activity, symptoms)
//  - Where the API key / model call is handled (server route, not client)
//  - Tone & safety guardrails for AI-generated wording (plain language,
//    no diagnosis, no dosage or treatment advice, always defer to care team)
const DUMMY_SUMMARY = `Over the past week, your energy has stayed mostly "Okay," with one "Good" day on Tuesday. Your protein intake looks steady — most logged meals included a protein source like eggs, chicken, or yogurt. Your last blood work showed hemoglobin and white blood cells both within a stable range compared to last month. Keep up the gentle stretching most days — it seems to line up with your better energy days.`;

export default function AiSummaryPage() {
  // Local UI-only simulation of a loading state — no real request is made.
  const [loading, setLoading] = useState(false);

  function handleRefresh() {
    setLoading(true);
    // Simulated delay only, purely for wireframe purposes.
    setTimeout(() => setLoading(false), 1400);
  }

  return (
    <div className="px-5 pb-5">
      <PageHeader title="AI Health Summary" backHref="/more" />

      <Card className="mt-4 border-0 bg-gradient-to-br from-teal to-teal-dark text-white">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Icon name="sparkle"/></span>
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-teal-light">Weekly overview</p>
        <h2 className="mt-1 font-display text-2xl font-bold">Your summary</h2>

        {loading ? (
          <div className="mt-4 flex flex-col items-center gap-3 py-8 text-center">
            <div
              aria-hidden="true"
              className="spinner h-10 w-10 rounded-full border-4 border-teal-light border-t-teal"
            />
            <p className="text-base text-white/80">Reviewing your entries...</p>
          </div>
        ) : (
          <p className="mt-3 text-base leading-relaxed text-white/90">{DUMMY_SUMMARY}</p>
        )}

      </Card>
      <p className="mt-4 flex gap-2 rounded-2xl bg-gold-light p-4 text-sm leading-relaxed text-inkSoft"><Icon name="info" className="shrink-0 text-gold"/>This overview is educational, not medical advice. Confirm health decisions with your care team.</p>

      <div className="mt-6">
        <BigButton onClick={handleRefresh}>
          {loading ? 'Refreshing...' : 'Refresh Summary'}
        </BigButton>
      </div>
    </div>
  );
}
