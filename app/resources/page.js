import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import BigButton from '@/components/BigButton';

export default function ResourcesPage() {
  return (
    <div className="px-5 pt-8">
      <PageHeader title="Resources" backHref="/more" />

      <Card className="mt-6">
        <h2 className="text-xl font-bold text-ink">This app doesn't replace your care team</h2>
        <p className="mt-3 text-lg leading-relaxed text-inkSoft">
          Wellness Companion is here to help you keep track of meals, energy, and blood work
          between appointments. It is not a substitute for advice from your doctor,
          oncologist, or registered dietitian. Always talk to them about any changes in
          how you feel, or before making changes to your diet or activity.
        </p>
      </Card>

      <Card className="mt-4">
        <h2 className="text-xl font-bold text-ink">Need to talk to someone?</h2>
        <p className="mt-2 text-lg text-inkSoft">
          Many cancer centers offer free or low-cost nutrition counseling for patients.
        </p>
        <div className="mt-4">
          {/* TODO: connect to a real directory of nutrition support services,
              filtered by location, once that data source is decided. */}
          <BigButton>Find Free/Low-Cost Nutrition Support</BigButton>
        </div>
      </Card>
    </div>
  );
}
