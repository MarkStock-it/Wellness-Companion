import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import BigButton from '@/components/BigButton';

// Placeholder static values only — TODO: connect to blood work data source
// (manual entry history and/or lab portal import) and replace this hand-drawn
// SVG with a real charting library once data shape is decided.
const HEMOGLOBIN_POINTS = [40, 55, 50, 65, 60, 72];
const WBC_POINTS = [70, 60, 68, 55, 62, 58];
const LABELS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

function toPath(points, width, height) {
  const step = width / (points.length - 1);
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step},${height - (p / 100) * height}`)
    .join(' ');
}

export default function BloodWorkPage() {
  const width = 300;
  const height = 160;

  return (
    <div className="px-5 pt-8">
      <PageHeader title="Blood Work Tracker" backHref="/" />

      <div className="mt-6">
        <Card>
          <h2 className="text-xl font-bold text-ink">Hemoglobin &amp; White Blood Cells</h2>
          <p className="mt-1 text-base text-inkSoft">Last 6 months (sample data)</p>

          {/* Static placeholder chart — no real calculations, no live data. */}
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="mt-4 w-full"
            role="img"
            aria-label="Placeholder trend chart of hemoglobin and white blood cell counts over the last six months"
          >
            <path d={toPath(HEMOGLOBIN_POINTS, width, height)} fill="none" stroke="#116466" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d={toPath(WBC_POINTS, width, height)} fill="none" stroke="#B5563C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 8" />
          </svg>

          <div className="mt-3 flex gap-6 text-base">
            <span className="flex items-center gap-2 text-ink">
              <span className="h-3 w-3 rounded-full bg-teal" aria-hidden="true" /> Hemoglobin
            </span>
            <span className="flex items-center gap-2 text-ink">
              <span className="h-3 w-3 rounded-full bg-clay" aria-hidden="true" /> White blood cells
            </span>
          </div>

          <div className="mt-2 flex justify-between text-sm text-inkSoft">
            {LABELS.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </Card>

        <Card className="mt-4">
          <h2 className="text-xl font-bold text-ink">Latest Result</h2>
          <dl className="mt-2 flex flex-col gap-2 text-lg">
            <div className="flex justify-between">
              <dt className="text-inkSoft">Hemoglobin</dt>
              <dd className="font-bold text-ink">12.4 g/dL</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-inkSoft">White blood cells</dt>
              <dd className="font-bold text-ink">5.8 x10⁹/L</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-inkSoft">Date</dt>
              <dd className="font-bold text-ink">Jul 21</dd>
            </div>
          </dl>
        </Card>

        <div className="mt-6">
          {/* TODO: connect to blood work data — open a real entry form or lab import */}
          <BigButton>+ Add New Result</BigButton>
        </div>
      </div>
    </div>
  );
}
