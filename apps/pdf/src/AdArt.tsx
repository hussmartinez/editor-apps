/**
 * A stack of pages, the top one smiling. The shell's ad slot shows it
 * until ads start (docs/adr/0007). Original art, drawn with the shell's
 * `app-ad-*` classes on ui's tokens, so it follows the brand and light or
 * dark mode. Decorative: the slot is hidden from assistive technology.
 */
export function AdArt() {
  return (
    <svg
      viewBox="0 0 160 520"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        className="app-ad-soft"
        x="44"
        y="64"
        width="92"
        height="124"
        rx="6"
        transform="rotate(8 90 126)"
      />
      <rect
        className="app-ad-paper"
        x="34"
        y="72"
        width="92"
        height="124"
        rx="6"
        transform="rotate(-6 80 134)"
      />
      <rect
        className="app-ad-line"
        x="34"
        y="72"
        width="92"
        height="124"
        rx="6"
        transform="rotate(-6 80 134)"
      />
      <path
        className="app-ad-paper"
        d="M30 220 H108 L132 244 V372 a6 6 0 0 1 -6 6 H36 a6 6 0 0 1 -6 -6 Z"
      />
      <path
        className="app-ad-line"
        d="M30 220 H108 L132 244 V372 a6 6 0 0 1 -6 6 H36 a6 6 0 0 1 -6 -6 Z"
      />
      <path className="app-ad-soft" d="M108 220 V244 H132 Z" />
      <path className="app-ad-line" d="M108 220 V244 H132" />
      <rect className="app-ad-accent" x="44" y="236" width="48" height="8" rx="4" />
      <rect className="app-ad-ink" x="44" y="256" width="72" height="5" rx="2.5" opacity="0.5" />
      <rect className="app-ad-ink" x="44" y="268" width="60" height="5" rx="2.5" opacity="0.5" />
      <circle className="app-ad-ink" cx="66" cy="310" r="4" />
      <circle className="app-ad-ink" cx="96" cy="310" r="4" />
      <path className="app-ad-line" d="M68 328 q13 12 26 0" />
      <circle className="app-ad-soft" cx="56" cy="324" r="6" />
      <circle className="app-ad-soft" cx="106" cy="324" r="6" />
      <rect className="app-ad-ink" x="44" y="352" width="72" height="5" rx="2.5" opacity="0.5" />
      <rect className="app-ad-accent" x="52" y="420" width="56" height="24" rx="12" />
      <path className="app-ad-paper" d="M76 424 h8 v8 h6 l-10 10 l-10 -10 h6 Z" />
    </svg>
  );
}
