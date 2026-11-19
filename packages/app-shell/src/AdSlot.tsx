import type { ReactNode } from "react";
import { messages } from "./messages.ts";

export interface AdSlotProps {
  /**
   * The app's placeholder art: an inline SVG, 160 wide and 520 high, drawn
   * with the `app-ad-*` classes so it follows the theme. Nothing loaded
   * from the network.
   */
  readonly children: ReactNode;
}

/**
 * The ad slot (docs/adr/0006, docs/adr/0007): a box of a fixed 160 × 600
 * pixels beside the editor, so nothing moves when a real ad fills it.
 * Until ads start it holds the app's own art and "Your ad here". It's
 * decorative, so it's hidden from assistive technology and inert: never a
 * tab stop. The stylesheet hides it on small screens.
 */
export function AdSlot({ children }: AdSlotProps) {
  return (
    <aside className="app-shell-ad" aria-hidden="true" inert>
      <div className="app-shell-ad-box">
        <div className="app-shell-ad-art">{children}</div>
        <p className="app-shell-ad-label">{messages.t("shell.ad.placeholder")}</p>
      </div>
    </aside>
  );
}
