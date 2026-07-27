'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import BigButton from '@/components/BigButton';

// TODO: connect to real daily-activity plan data source.
const TODAYS_ACTIVITY = {
  title: 'Gentle Stretching',
  duration: '10 min',
};

const ENERGY_OPTIONS = ['Low', 'Okay', 'Good'];

export default function ActivityPage() {
  // Local UI state only — nothing is saved or sent anywhere.
  // TODO: connect to real energy-log data source.
  const [done, setDone] = useState(false);
  const [energy, setEnergy] = useState(null);

  return (
    <div className="px-5 pt-8">
      <PageHeader title="Activity" backHref="/" />

      <Card className="mt-6">
        <p className="text-base font-bold uppercase tracking-wide text-teal-dark">Today</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-ink">
          {TODAYS_ACTIVITY.title} — {TODAYS_ACTIVITY.duration}
        </h2>
        <p className="mt-2 text-lg text-inkSoft">
          A slow, seated or standing stretch. Stop any time it feels like too much.
        </p>

        <div className="mt-5">
          <BigButton
            variant={done ? 'secondary' : 'primary'}
            onClick={() => setDone((d) => !d)}
          >
            {done ? '✓ Marked as Done' : 'Mark as Done'}
          </BigButton>
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="text-xl font-bold text-ink">How's your energy right now?</h2>
        <div className="mt-4 flex gap-3">
          {ENERGY_OPTIONS.map((option) => {
            const selected = energy === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setEnergy(option)}
                aria-pressed={selected}
                className={`min-h-touch flex-1 rounded-card border-2 text-lg font-bold
                  ${selected ? 'border-teal bg-teal text-white' : 'border-line bg-surface text-ink'}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
