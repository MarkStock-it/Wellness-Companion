import './globals.css';
import BottomNav from '@/components/BottomNav';
import PrototypeShell from '@/components/PrototypeShell';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const metadata = {
  title: 'Wellness Companion',
  applicationName: 'Wellness Companion',
  description:
    'A simple daily companion for meals, blood work, activity, and symptoms — built for cancer patients and easy for older adults to use.',
  icons: {
    icon: [
      { url: `${basePath}/icons/favicon-32.png`, sizes: '32x32', type: 'image/png' },
      { url: `${basePath}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: `${basePath}/icons/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Wellness',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // never block pinch-zoom for this audience
  themeColor: '#116466',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head><link rel="manifest" href={`${basePath}/manifest.webmanifest`} /></head>
      <body>
        <ServiceWorkerRegister />
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
