const paths = {
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></>,
  meals: <><path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10"/><path d="M17 3v18M17 3c-3 2-3 8 0 10"/></>,
  blood: <><path d="M12 3s-6 7-6 12a6 6 0 0 0 12 0c0-5-6-12-6-12Z"/><path d="M9 16c.5 1.5 1.5 2 3 2"/></>,
  activity: <><circle cx="12" cy="5" r="2"/><path d="m9 21 2-6-3-3 2-4 4 2 2 4 3 1M11 15l4 1 1 5"/></>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  energy: <><rect x="3" y="7" width="17" height="10" rx="2"/><path d="M22 10v4M6 10h7v4H6z"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  chevron: <path d="m9 5 7 7-7 7"/>,
  back: <path d="m15 5-7 7 7 7"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  camera: <><path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4"/></>,
  bowl: <><path d="M4 11h16a8 8 0 0 1-16 0Z"/><path d="M8 7c0-2 2-2 2-4M13 8c0-2 2-2 2-4M8 19v2M16 19v2"/></>,
  clipboard: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h4"/></>,
  sparkle: <><path d="m12 3 1.4 4.1L17 9l-3.6 1.9L12 15l-1.4-4.1L7 9l3.6-1.9L12 3Z"/><path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14Z"/></>,
  phone: <path d="M6.6 3h3l1.5 4-2 1.5a15 15 0 0 0 6.4 6.4l1.5-2 4 1.5v3c0 2-1.7 3.6-3.7 3.4C9.8 20 4 14.2 3.2 6.7 3 4.7 4.6 3 6.6 3Z"/>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
  trend: <><path d="m3 17 5-5 4 3 7-8"/><path d="M14 7h5v5"/></>,
  heart: <path d="M20.8 5.7a5.5 5.5 0 0 0-7.8 0L12 6.8l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z"/>,
};

export default function Icon({ name, size = 24, className = '', strokeWidth = 2 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
      strokeLinejoin="round" className={className}>
      {paths[name]}
    </svg>
  );
}
