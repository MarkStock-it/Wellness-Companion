import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';

// Placeholder suggestions — TODO: connect to a real meal-ideas data source
// (nutrition team content, recipe database, etc.) once scope is decided.
const MEAL_IDEAS = [
  { title: 'Scrambled Eggs & Toast', tag: 'High Protein' },
  { title: 'Chicken & Rice Soup', tag: 'Easy to Digest' },
  { title: 'Banana Smoothie', tag: 'Good for Low Appetite' },
  { title: 'Baked Salmon & Mash', tag: 'High Protein' },
  { title: 'Plain Yogurt & Peaches', tag: 'Easy to Digest' },
  { title: 'Peanut Butter Toast', tag: 'High Calorie' },
];

export default function MealIdeasPage() {
  return (
    <div className="px-5 pt-8">
      <PageHeader title="Meal Ideas" backHref="/more" />

      <p className="mt-6 text-lg text-inkSoft">Simple meals other patients have found helpful.</p>

      <div className="mt-4 flex flex-col gap-4">
        {MEAL_IDEAS.map((meal) => (
          <Card key={meal.title} className="flex items-center gap-4">
            {/* Image placeholder — TODO: connect to real meal photos */}
            <div
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-card bg-gold-light text-2xl"
            >
              🍲
            </div>
            <span className="flex-1">
              <span className="block text-lg font-bold text-ink">{meal.title}</span>
              <span className="mt-1 inline-block rounded-full bg-teal-light px-3 py-1 text-sm font-bold text-teal-dark">
                {meal.tag}
              </span>
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
