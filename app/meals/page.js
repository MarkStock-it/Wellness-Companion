import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import BigButton from '@/components/BigButton';

// Placeholder data — TODO: connect to meal log data source once storage &
// photo-upload handling are decided.
const MEALS = [
  { slot: 'Breakfast', logged: true, detail: 'Oatmeal with banana, herbal tea' },
  { slot: 'Lunch', logged: true, detail: 'Chicken soup, soft bread' },
  { slot: 'Dinner', logged: false, detail: 'Not logged yet' },
  { slot: 'Snacks', logged: false, detail: 'Not logged yet' },
];

export default function MealsPage() {
  return (
    <div className="px-5 pt-8">
      <PageHeader title="Meal Log" backHref="/" />

      <p className="mt-6 text-lg text-inkSoft">Today's meals</p>

      <div className="mt-3 flex flex-col gap-4">
        {MEALS.map((meal) => (
          <Card key={meal.slot} className="flex items-center gap-4">
            <span className="flex-1">
              <span className="block text-xl font-bold text-ink">{meal.slot}</span>
              <span className={`block text-base ${meal.logged ? 'text-inkSoft' : 'text-inkSoft italic'}`}>
                {meal.detail}
              </span>
            </span>
            <button
              type="button"
              aria-label={`Add ${meal.slot.toLowerCase()}`}
              onClick={() => console.log(`Dummy add-meal tap: ${meal.slot}`)}
              className="flex min-h-touch min-w-touch items-center justify-center rounded-full bg-teal-light text-2xl font-bold text-teal-dark"
            >
              +
            </button>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        {/* TODO: connect to camera / food recognition once that scope is decided */}
        <BigButton variant="secondary">
          <span aria-hidden="true">📷</span> Take Photo of a Meal
        </BigButton>
      </div>
    </div>
  );
}
