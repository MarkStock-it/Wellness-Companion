import './globals.css';
import BottomNav from '@/components/BottomNav';
import PrototypeShell from '@/components/PrototypeShell';

export const metadata = {
  title: 'Wellness Companion',
  description:
    'A simple daily companion for meals, blood work, activity, and symptoms — built for cancer patients and easy for older adults to use.',
  // TODO: add a real manifest.json + icons here when this becomes an installable PWA.
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // never block pinch-zoom for this audience
  themeColor: '#FBF8F2',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Single-column, mobile-first shell. Bottom padding reserves room
            for the fixed bottom nav so content never hides behind it. */}
        <div className="mx-auto flex min-h-screen max-w-md flex-col pb-24">
          <main className="flex-1">{children}</main>
        </div>
        <PrototypeShell />
        <BottomNav />
      </body>
    </html>
  );
}
