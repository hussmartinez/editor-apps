/**
 * A waveform, a few notes and a cassette. The shell's ad slot shows it
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
      <circle className="app-ad-soft" cx="80" cy="150" r="64" />
      {[18, 34, 54, 74, 90, 74, 54, 34, 18].map((height, index) => (
        <rect
          // biome-ignore lint/suspicious/noArrayIndexKey: a fixed drawing.
          key={index}
          className="app-ad-accent"
          x={37 + index * 10}
          y={150 - height / 2}
          width="6"
          height={height}
          rx="3"
        />
      ))}
      <circle className="app-ad-ink" cx="40" cy="300" r="7" />
      <path className="app-ad-line" d="M46 300 V268 l18 -6 V292" />
      <circle className="app-ad-ink" cx="58" cy="292" r="7" />
      <circle className="app-ad-accent" cx="118" cy="322" r="8" />
      <path className="app-ad-line" d="M125 322 V286" />
      <rect className="app-ad-paper" x="26" y="380" width="108" height="72" rx="10" />
      <rect className="app-ad-line" x="26" y="380" width="108" height="72" rx="10" />
      <rect className="app-ad-soft" x="44" y="396" width="72" height="30" rx="6" />
      <circle className="app-ad-accent" cx="62" cy="411" r="10" />
      <circle className="app-ad-accent" cx="98" cy="411" r="10" />
      <path className="app-ad-line" d="M50 452 l8 -12 h44 l8 12" />
    </svg>
  );
}
