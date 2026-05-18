import type { IconName } from '@/types';

const ICONS: Record<IconName, string> = {
  search:   'M11 18a7 7 0 1 1 4.95-2.05L20 20',
  chevronR: 'm9 6 6 6-6 6',
  chevronD: 'm6 9 6 6 6-6',
  chevronL: 'm15 18-6-6 6-6',
  chevronU: 'm18 15-6-6-6 6',
  plus:     'M12 5v14M5 12h14',
  minus:    'M5 12h14',
  check:    'm5 12 5 5 9-11',
  x:        'm6 6 12 12M18 6 6 18',
  user:     'M5 21a7 7 0 0 1 14 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  users:    'M3 21a6 6 0 0 1 12 0M21 21a5 5 0 0 0-7-4.6M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM16 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  bell:     'M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21a2 2 0 0 0 4 0',
  calendar: 'M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM8 3v4M16 3v4',
  clock:    'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  grid:     'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  list:     'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  trash:    'M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  pencil:   'm12 20 9-9-4-4-9 9v4h4zM14 7l4 4',
  link:     'M10 14a5 5 0 0 1 0-7l3-3a5 5 0 0 1 7 7l-1.5 1.5M14 10a5 5 0 0 1 0 7l-3 3a5 5 0 0 1-7-7l1.5-1.5',
  qr:       'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v3M17 20h3v1M14 18h1',
  copy:     'M9 9h11v11H9zM5 15V5a1 1 0 0 1 1-1h10',
  arrowR:   'M5 12h14m-5-5 5 5-5 5',
  arrowL:   'M19 12H5m5-5-5 5 5 5',
  phone:    'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 2.9a2 2 0 0 1-.5 2.1L7.9 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.5 2.9.6a2 2 0 0 1 1.7 2z',
  shield:   'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  zap:      'M13 2 3 14h9l-1 8 10-12h-9z',
  send:     'm22 2-7 20-4-9-9-4 20-7z',
  qDots:    '',
  building: 'M3 21h18M5 21V7l8-4 8 4v14M9 9h.01M13 9h.01M9 13h.01M13 13h.01M9 17h.01M13 17h.01',
  chair:    'M6 17v4M18 17v4M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M4 11h16v6H4z',
  sparkles: 'M5 3v4M3 5h4M19 17v4M17 19h4M12 3 9 9l-6 3 6 3 3 6 3-6 6-3-6-3z',
  alert:    'M12 9v4M12 17h.01M10.3 3.86a2 2 0 0 1 3.4 0l8.1 14.14A2 2 0 0 1 20.1 21H3.9a2 2 0 0 1-1.7-3l8.1-14.14z',
  info:     'M12 16v-4M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  dotsH:    'M5 12h.01M12 12h.01M19 12h.01',
  filter:   'M3 5h18l-7 8v6l-4-2v-4z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  refresh:  'M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5',
  logout:   'M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4',
};

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 16, stroke = 1.6, className, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'block', flex: 'none', ...style }}
    >
      <path d={ICONS[name]} />
    </svg>
  );
}
