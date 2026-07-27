export default function manifest() {
  return {
    name: 'Wellness Companion',
    short_name: 'Wellness',
    description: 'A local-first companion for meals, movement, symptoms, blood work, and wellness insights.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#FBF8F2',
    theme_color: '#116466',
    categories: ['health', 'lifestyle', 'medical'],
    lang: 'en',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      { name: 'Log a meal', short_name: 'Meal', url: '/meals', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Blood work', short_name: 'Blood work', url: '/blood-work', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Daily check-in', short_name: 'Check-in', url: '/symptoms', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
