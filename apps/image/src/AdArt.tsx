/**
 * A camera, a little photo and a palette. The shell's ad slot shows it
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
      <rect className="app-ad-paper" x="40" y="36" width="80" height="92" rx="4" />
      <rect className="app-ad-line" x="40" y="36" width="80" height="92" rx="4" />
      <rect className="app-ad-soft" x="48" y="44" width="64" height="56" rx="2" />
      <circle className="app-ad-accent" cx="96" cy="60" r="8" />
      <path className="app-ad-accent" d="M48 100 l22 -24 l14 14 l10 -8 l18 18 Z" />
      <rect className="app-ad-accent" x="58" y="168" width="28" height="16" rx="4" />
      <rect className="app-ad-accent" x="20" y="180" width="120" height="88" rx="14" />
      <circle className="app-ad-paper" cx="80" cy="224" r="32" />
      <circle className="app-ad-soft" cx="80" cy="224" r="22" />
      <circle className="app-ad-accent" cx="80" cy="224" r="9" />
      <circle className="app-ad-paper" cx="88" cy="216" r="4" />
      <rect className="app-ad-paper" x="112" y="192" width="16" height="10" rx="3" />
      <path
        className="app-ad-paper"
        d="M80 320 c40 0 64 24 64 56 c0 24 -18 30 -30 26 c-12 -4 -22 2 -18 16 c4 16 -6 26 -24 26 c-36 0 -56 -30 -56 -64 c0 -34 28 -60 64 -60 Z"
      />
      <path
        className="app-ad-line"
        d="M80 320 c40 0 64 24 64 56 c0 24 -18 30 -30 26 c-12 -4 -22 2 -18 16 c4 16 -6 26 -24 26 c-36 0 -56 -30 -56 -64 c0 -34 28 -60 64 -60 Z"
      />
      <circle className="app-ad-accent" cx="56" cy="356" r="10" />
      <circle className="app-ad-soft" cx="88" cy="346" r="10" />
      <circle className="app-ad-ink" cx="116" cy="370" r="9" />
      <circle className="app-ad-accent" cx="48" cy="394" r="8" />
      <circle className="app-ad-soft" cx="66" cy="424" r="8" />
    </svg>
  );
}
