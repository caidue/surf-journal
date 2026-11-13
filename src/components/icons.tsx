/** Small stroke icon set (24 px grid, 1.8 px stroke, currentColor) so navigation and tabs look consistent. */
const PATHS = {
  explore: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5 13.6 13.6 8.5 15.5 10.4 10.4Z" />
    </>
  ),
  log: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  journal: (
    <>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5Z" />
      <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 7.5h6M9 11h4" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
  forecast: <path d="M3 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 3 2M3 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 3 2M8 9a4 4 0 0 1 8 0" />,
  guide: (
    <>
      <path d="M3 5.5C5.5 4 8.5 4 12 6c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5Z" />
      <path d="M12 6v13.5" />
    </>
  ),
  sessions: (
    <>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.5v.01" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5Z" />
      <path d="M9 4v13.5M15 6.5V20" />
    </>
  ),
  list: <path d="M4 6h16M4 12h16M4 18h16" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  locate: (
    <>
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
    </>
  ),
  expand: <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  text: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M7.5 9h9M7.5 12.5h9M7.5 16h5.5" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS | 'logo';

export function Icon({ name, size = 20, title }: { name: IconName; size?: number; title?: string }) {
  if (name === 'logo') {
    // The Surf Journal mark (same wave as the app icon), drawn in currentColor.
    return (
      <svg className="icon" width={size} height={size} viewBox="0 0 32 32" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
        {title && <title>{title}</title>}
        <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M5 20c4-8 10-10 14-6-3 0-5 2-4 5 2 3 7 2 12-1-3 6-9 9-15 8-4 0-6-2-7-6z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  );
}
