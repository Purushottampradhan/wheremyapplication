import type { ReactNode } from 'react';

export type IconName =
  | 'briefcase'
  | 'layers'
  | 'columns'
  | 'scan'
  | 'spark'
  | 'chart'
  | 'banknote'
  | 'bell'
  | 'panel'
  | 'user'
  | 'filter'
  | 'download'
  | 'menu'
  | 'close'
  | 'shield';

const paths: Record<IconName, ReactNode> = {
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3 3 8l9 5 9-5-9-5z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 16l9 5 9-5" />
    </>
  ),
  columns: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18" />
    </>
  ),
  scan: (
    <>
      <path d="M4 8V5h3M17 5h3v3M20 16v3h-3M7 19H4v-3" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  spark: (
    <path d="M12 3.2 13.6 8.4 19 10l-5.4 1.6L12 16.8 10.4 11.6 5 10l5.4-1.6L12 3.2z" />
  ),
  chart: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-5M12 16V8M16 16v-3" />
    </>
  ),
  banknote: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M7 9.5h.01M17 14.5h.01" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  panel: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M5.5 19c1.4-3 3.6-4.5 6.5-4.5s5.1 1.5 6.5 4.5" />
    </>
  ),
  filter: <path d="M4 5h16l-6 7v5l-4 2v-7L4 5z" />,
  download: (
    <>
      <path d="M12 4v10" />
      <path d="M8 10l4 4 4-4" />
      <path d="M5 19h14" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  shield: <path d="M12 3 19 6v6c0 4.2-2.8 7.2-7 8.8C7.8 19.2 5 16.2 5 12V6l7-3z" />,
};

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="wma-icon"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
