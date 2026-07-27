import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';

const MORE_ITEMS = [
  { href: '/meal-ideas', title: 'Meal Ideas', detail: 'Simple meal suggestions', icon: '🍲' },
  { href: '/symptoms', title: 'Daily Check-in', detail: 'Appetite, nausea, fatigue, mood', icon: '📝' },
  { href: '/ai-summary', title: 'AI Health Summary', detail: 'A plain-language overview', icon: '✨' },
  { href: '/resources', title: 'Resources', detail: 'Talk to a professional', icon: '📞' },
];

export default function MorePage() {
  return (
    <div className="px-5 pt-8">
      <PageHeader title="More" />

      <div className="mt-6 flex flex-col gap-4">
        {MORE_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <Card className="flex items-center gap-4 active:opacity-80">
              <span aria-hidden="true" className="text-3xl">{item.icon}</span>
              <span className="flex-1">
                <span className="block text-lg font-bold text-ink">{item.title}</span>
                <span className="block text-base text-inkSoft">{item.detail}</span>
              </span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-inkSoft shrink-0">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
