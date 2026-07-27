'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import BigButton from '@/components/BigButton';

// TODO: connect to real symptom-log data source.
const QUESTIONS = [
  {
    key: 'appetite',
    label: 'Appetite',
    options: [
      { emoji: '🙁', text: 'Low' },
      { emoji: '😐', text: 'Some' },
      { emoji: '🙂', text: 'Good' },
    ],
  },
  {
    key: 'nausea',
    label: 'Nausea',
    options: [
      { emoji: '🙂', text: 'None' },
      { emoji: '😐', text: 'A little' },
      { emoji: '🙁', text: 'A lot' },
    ],
  },
  {
    key: 'fatigue',
    label: 'Fatigue',
    options: [
      { emoji: '🙂', text: 'Low' },
      { emoji: '😐', text: 'Some' },
      { emoji: '🙁', text: 'High' },
    ],
  },
  {
    key: 'mood',
    label: 'Mood',
    options: [
      { emoji: '🙁', text: 'Down' },
      { emoji: '😐', text: 'Okay' },
      { emoji: '🙂', text: 'Good' },
    ],
  },
];

export default function SymptomsPage() {
  // Local UI state only — nothing is saved or sent anywhere yet.
  const [answers, setAnswers] = useState({});

  return (
    <div className="px-5 pt-8">
      <PageHeader title="Daily Check-in" backHref="/more" />

      <p className="mt-6 text-lg text-inkSoft">How are you feeling today?</p>

      <div className="mt-4 flex flex-col gap-5">
        {QUESTIONS.map((q) => (
          <Card key={q.key}>
            <h2 className="text-xl font-bold text-ink">{q.label}</h2>
            <div className="mt-3 flex gap-3">
              {q.options.map((opt) => {
                const selected = answers[q.key] === opt.text;
                return (
                  <button
                    key={opt.text}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setAnswers((a) => ({ ...a, [q.key]: opt.text }))}
                    className={`flex min-h-touch flex-1 flex-col items-center justify-center gap-1 rounded-card border-2 py-3
                      ${selected ? 'border-teal bg-teal-light' : 'border-line bg-canvas'}`}
                  >
                    <span aria-hidden="true" className="text-3xl">{opt.emoji}</span>
                    <span className="text-base font-bold text-ink">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        {/* TODO: connect to real symptom-log data source */}
        <BigButton>Save Today's Check-in</BigButton>
      </div>
    </div>
  );
}
