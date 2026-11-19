/**
 * A film strip, with a sunrise, a play button and a smile in its frames.
 * The shell's ad slot shows it until ads start (docs/adr/0007). Original
 * art, drawn with the shell's `app-ad-*` classes on ui's tokens, so it
 * follows the brand and light or dark mode. Decorative: the slot is hidden
 * from assistive technology.
 */
export function AdArt() {
  return (
    <svg
      viewBox="0 0 160 520"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect className="app-ad-ink" x="32" y="24" width="96" height="472" rx="8" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((row) => (
        <g key={row}>
          <rect className="app-ad-paper" x="38" y={36 + row * 42} width="10" height="14" rx="2" />
          <rect className="app-ad-paper" x="112" y={36 + row * 42} width="10" height="14" rx="2" />
        </g>
      ))}
      <rect className="app-ad-paper" x="54" y="40" width="52" height="128" rx="4" />
      <circle className="app-ad-accent" cx="80" cy="96" r="14" />
      <path className="app-ad-soft" d="M54 168 V136 l18 -14 l14 12 l20 -18 V168 Z" />
      <rect className="app-ad-paper" x="54" y="196" width="52" height="128" rx="4" />
      <circle className="app-ad-soft" cx="80" cy="260" r="20" />
      <path className="app-ad-accent" d="M74 248 L92 260 L74 272 Z" />
      <rect className="app-ad-paper" x="54" y="352" width="52" height="128" rx="4" />
      <circle className="app-ad-soft" cx="80" cy="416" r="20" />
      <circle className="app-ad-ink" cx="73" cy="410" r="3" />
      <circle className="app-ad-ink" cx="87" cy="410" r="3" />
      <path className="app-ad-line" d="M72 422 q8 7 16 0" />
    </svg>
  );
}
