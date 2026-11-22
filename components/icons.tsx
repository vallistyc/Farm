export type NavIconName = "home" | "farm" | "chart" | "chat" | "user";
export type ActionIconName = "calculator" | "plus" | "chart" | "sparkle";

function glyph(name: NavIconName | ActionIconName) {
  switch (name) {
    case "home":
      return (
        <>
          <path d="m3 10.5 9-7.5 9 7.5" />
          <path d="M5.5 9.5V21h13V9.5" />
          <path d="M9.5 21v-6h5v6" />
        </>
      );
    case "farm":
      return (
        <>
          <path d="M12 21v-7" />
          <path d="M12 14c-4 0-6-2.4-6-6 4 0 6 2.4 6 6Z" />
          <path d="M12 12c0-3.6 2-6 6-6 0 3.6-2 6-6 6Z" />
        </>
      );
    case "chart":
      return (
        <>
          <path d="M4 4v16h16" />
          <path d="m7.5 14.5 3.5-4 3 2.5 4.5-5.5" />
        </>
      );
    case "chat":
      return (
        <>
          <path d="M4 5.5h16v11H9.5L4 20.5v-15Z" />
          <path d="M8 10h8M8 13h5" />
        </>
      );
    case "user":
      return (
        <>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20.5c.7-3.6 3.4-5.5 7-5.5s6.3 1.9 7 5.5" />
        </>
      );
    case "calculator":
      return (
        <>
          <rect x="5.5" y="3.5" width="13" height="17" rx="2" />
          <path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" />
        </>
      );
    case "plus":
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 8v8M8 12h8" />
        </>
      );
    case "sparkle":
      return (
        <>
          <path d="M11 4.5l1.5 3.9 3.9 1.5-3.9 1.5L11 15.3l-1.5-3.9-3.9-1.5 3.9-1.5L11 4.5Z" />
          <path d="M17.5 14.5l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1Z" />
        </>
      );
  }
}

export function GlyphIcon({
  name,
  className = "size-6",
}: {
  name: NavIconName | ActionIconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {glyph(name)}
    </svg>
  );
}
