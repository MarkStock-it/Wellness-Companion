'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import BigButton from '@/components/BigButton';

// Dummy summary text only — TODO: connect to real AI summary API.
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
    <div className="px-5 pt-8">
      <PageHeader title="AI Health Summary" backHref="/more" />

      <Card className="mt-6">
        <h2 className="text-xl font-bold text-ink">Your summary</h2>

        {loading ? (
          <div className="mt-4 flex flex-col items-center gap-3 py-8 text-center">
            <div
              aria-hidden="true"
              className="spinner h-10 w-10 rounded-full border-4 border-teal-light border-t-teal"
            />
            <p className="text-lg text-inkSoft">Analyzing your data...</p>
          </div>
        ) : (
          <p className="mt-3 text-lg leading-relaxed text-ink">{DUMMY_SUMMARY}</p>
        )}

        <p className="mt-5 text-base italic text-inkSoft">
          This is not medical advice. Always confirm with your doctor or dietitian.
        </p>
      </Card>

      <div className="mt-6">
        <BigButton onClick={handleRefresh}>
          {loading ? 'Refreshing...' : 'Refresh Summary'}
        </BigButton>
      </div>
    </div>
  );
}
