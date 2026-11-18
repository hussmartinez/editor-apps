import { framesToSeconds } from "@hussmartinez/audio-sdk";

/** A position as `0:12.40`, with hundredths of a second, as the SDK's editor will show it. */
export function formatTime(frames: number, sampleRate: number): string {
  const hundredths = Math.floor(framesToSeconds(frames, sampleRate) * 100 + 1e-6);
  const minutes = Math.floor(hundredths / 6000);
  const seconds = Math.floor((hundredths % 6000) / 100);
  const rest = hundredths % 100;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(rest).padStart(2, "0")}`;
}

/** The export's file name: the recording's, without its extension. */
export function exportName(fileName: string): string {
  const base = fileName.replace(/\.[^.]*$/, "") || "recording";
  return `${base}-edited.wav`;
}
