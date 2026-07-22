type IconName =
  | "search"
  | "location"
  | "star"
  | "check"
  | "shield"
  | "arrow"
  | "heart"
  | "house"
  | "hardhat"
  | "compass"
  | "sofa"
  | "ruler"
  | "chef"
  | "leaf"
  | "cube"
  | "drop"
  | "bolt"
  | "saw"
  | "brush"
  | "spray"
  | "sparkle"
  | "verified"
  | "menu"
  | "close"
  | "phone"
  | "mail"
  | "chevronDown"
  | "arrowLeft"
  | "chat"
  | "grid"
  | "villa"
  | "apartment"
  | "plot"
  | "office"
  | "share"
  | "clock"
  | "calendar"
  | "briefcase"
  | "book"
  | "bookmark"
  | "user"
  | "camera"
  | "logout"
  | "edit"
  | "trash"
  | "settings";

const PATHS: Record<IconName, React.ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </>
  ),
  location: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-10.2A6.5 6.5 0 0 1 18.5 10.8C18.5 15.4 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.3" />
    </>
  ),
  star: (
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9z" />
  ),
  check: <path d="M4 12.5l5 5L20 6.5" />,
  shield: (
    <>
      <path d="M12 3l7 2.5v5.5c0 4.5-3 7.8-7 9.5-4-1.7-7-5-7-9.5V5.5z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </>
  ),
  heart: (
    <path d="M12 20s-7-4.5-7-9.5A3.8 3.8 0 0 1 12 7.5 3.8 3.8 0 0 1 19 10.5C19 15.5 12 20 12 20Z" />
  ),
  house: (
    <>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6 10.5V19a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-8.5" />
    </>
  ),
  hardhat: (
    <>
      <path d="M4 17a8 8 0 0 1 16 0" />
      <path d="M10 9.2A8 8 0 0 0 4 17M14 9.2A8 8 0 0 1 20 17M10 9V6.5A1.5 1.5 0 0 1 11.5 5h1A1.5 1.5 0 0 1 14 6.5V9M3 17h18v1.5H3z" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  sofa: (
    <>
      <path d="M5 11V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
      <path d="M3.5 12.5A1.5 1.5 0 0 1 5 14v2h14v-2a1.5 1.5 0 0 1 3 0V18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-4a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M7 14v-1.5h10V14" />
    </>
  ),
  ruler: (
    <>
      <rect x="3" y="8" width="18" height="8" rx="1.5" />
      <path d="M7 8v3M11 8v4M15 8v3M19 8v4" />
    </>
  ),
  chef: (
    <>
      <path d="M8 13.5A3.5 3.5 0 0 1 7.5 6.6 4 4 0 0 1 15 6 3.6 3.6 0 0 1 16 13.5" />
      <path d="M8 13.5h8V18a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14Z" />
      <path d="M5 19c3-5 6-7 10-9" />
    </>
  ),
  cube: (
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="M12 3v9m0 0 8-4.5M12 12 4 7.5M12 12v9" />
    </>
  ),
  drop: (
    <path d="M12 3.5c3 4 5.5 6.6 5.5 9.5a5.5 5.5 0 0 1-11 0c0-2.9 2.5-5.5 5.5-9.5Z" />
  ),
  bolt: <path d="M13 3 5 13h5l-1 8 8-10h-5z" />,
  saw: (
    <>
      <path d="M3 9h13l-2 3H5z" />
      <path d="M16 9l4-3v6zM5 12l1 7" />
    </>
  ),
  brush: (
    <>
      <path d="M14 4l6 6-7 7-3-3z" />
      <path d="M10 14l-4 1-2 5 5-2 1-4" />
    </>
  ),
  spray: (
    <>
      <rect x="8" y="9" width="7" height="11" rx="1.5" />
      <path d="M8 12h7M11 9V6h3M18 5v.01M20 7v.01M18 9v.01M16 7v.01" />
    </>
  ),
  sparkle: (
    <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z" />
  ),
  verified: (
    <>
      <path d="M12 3l2 2.2 3-.3.6 3 2.6 1.6-1.4 2.7 1.4 2.7-2.6 1.6-.6 3-3-.3L12 21l-2-2.2-3 .3-.6-3L3.8 12.5l1.4-2.7L3.8 7.1l2.6-1.6.6-3 3 .3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  phone: (
    <path d="M6 3h3l1.5 5L8 9.5a12 12 0 0 0 6.5 6.5L16 14l5 1.5V19a2 2 0 0 1-2.2 2A16 16 0 0 1 5 7.2 2 2 0 0 1 7 5z" />
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
  arrowLeft: (
    <>
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </>
  ),
  chat: <path d="M5 5h14v10H9l-4 4z" />,
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  villa: (
    <>
      <path d="M3 12l6-4.5L15 12" />
      <path d="M5 11v7a1 1 0 0 0 1 1h4v-4h2v4h2a1 1 0 0 0 1-1v-4" />
      <path d="M15 12h5v6a1 1 0 0 1-1 1h-4" />
    </>
  ),
  apartment: (
    <>
      <rect x="6" y="3.5" width="12" height="17" rx="1" />
      <path d="M9 7h1.5M13.5 7H15M9 10.5h1.5M13.5 10.5H15M9 14h1.5M13.5 14H15" />
      <path d="M10 20.5V17h4v3.5" />
    </>
  ),
  plot: (
    <>
      <path d="M3 8l9-4.5L21 8v9l-9 4.5L3 17z" />
      <path d="M3 8l9 4.5M12 12.5 21 8M12 12.5V21" />
    </>
  ),
  office: (
    <>
      <rect x="5" y="3" width="10" height="18" rx="1" />
      <path d="M8 6.5h1M11 6.5h1M8 9.5h1M11 9.5h1M8 12.5h1M11 12.5h1M8 15.5h1M11 15.5h1" />
      <path d="M15 9v12h5V13h-5" />
    </>
  ),
  share: (
    <>
      <path d="M12 15V3" />
      <path d="M7.5 7.5 12 3l4.5 4.5" />
      <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 1.8" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="2.5" />
      <path d="M4 10h16M8 3.5v4M16 3.5v4" />
    </>
  ),
  briefcase: (
    <>
      <rect x="4" y="7.5" width="16" height="12" rx="2" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M4 13h16" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5a2 2 0 0 1 2-2h5.5v15H6a2 2 0 0 0-2 2z" />
      <path d="M20 5.5a2 2 0 0 0-2-2h-5.5v15H18a2 2 0 0 1 2 2z" />
    </>
  ),
  bookmark: <path d="M6 3.5h12v17l-6-4-6 4z" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c0-4.1 3.4-6.5 7.5-6.5s7.5 2.4 7.5 6.5" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.1-1.8A1.5 1.5 0 0 1 9.9 4.5h4.2a1.5 1.5 0 0 1 1.3.7L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z" />
      <circle cx="12" cy="12.5" r="3.4" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5.5A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3H9" />
      <path d="M16 16.5 21 12l-5-4.5" />
      <path d="M21 12H9" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20l.7-4L16.6 4.1a1.7 1.7 0 0 1 2.4 0l1 1a1.7 1.7 0 0 1 0 2.4L8 19.3z" />
      <path d="M14.5 6.5l3 3" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2" />
      <path d="M6 7l1 13a1.5 1.5 0 0 0 1.5 1.4h7a1.5 1.5 0 0 0 1.5-1.4l1-13" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="2.6" />
      <path d="M12 4v2.4M12 17.6V20M20 12h-2.4M6.4 12H4M17.3 6.7l-1.7 1.7M8.4 15.6l-1.7 1.7M17.3 17.3l-1.7-1.7M8.4 8.4 6.7 6.7" />
    </>
  ),
};

export type { IconName };

export default function Icon({
  name,
  size = 24,
  strokeWidth = 1.8,
  filled = false,
  color,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  filled?: boolean;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{
        color,
        fill: filled ? "currentColor" : "none",
        stroke: filled ? "none" : "currentColor",
      }}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
