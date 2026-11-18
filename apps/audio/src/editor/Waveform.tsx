import {
  type AudioPeakLevel,
  type AudioPlan,
  type AudioSelection,
  type AudioSession,
  clipLength,
  dbToGain,
  planLength,
} from "@hussmartinez/audio-sdk";
import { type PointerEvent, useEffect, useRef } from "react";

interface WaveformProps {
  readonly session: AudioSession;
  readonly plan: AudioPlan;
  readonly selection: AudioSelection | undefined;
  readonly playhead: number;
  readonly onSeek: (frame: number) => void;
  readonly onSelect: (selection: AudioSelection | undefined) => void;
}

/** How far a pointer moves, in CSS pixels, before a press becomes a drag. */
const DRAG_THRESHOLD = 4;

/**
 * The plan's waveform, with the selected range and the playhead over it.
 *
 * It's for pointers only, and hidden from assistive technology: dragging
 * selects a range, and a click moves the playhead and clears the selection.
 * The playhead slider, the Set start and Set end buttons and the text under
 * the waveform give the same to keyboards and screen readers.
 */
export function Waveform({ session, plan, selection, playhead, onSeek, onSelect }: WaveformProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; frame: number; moved: boolean }>(undefined);
  const length = planLength(plan);

  // Redrawn when the plan, the size or the colours change, never as the
  // playhead moves: the playhead and the selection are elements over it.
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let request = 0;
    const schedule = () => {
      cancelAnimationFrame(request);
      request = requestAnimationFrame(() => drawWaveform(element, plan, session));
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    const queries = ["(prefers-color-scheme: dark)", "(forced-colors: active)"].map((query) =>
      matchMedia(query),
    );
    for (const query of queries) query.addEventListener("change", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(request);
      observer.disconnect();
      for (const query of queries) query.removeEventListener("change", schedule);
    };
  }, [plan, session]);

  const frameAt = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const fraction = box.width > 0 ? (event.clientX - box.left) / box.width : 0;
    return Math.round(Math.min(1, Math.max(0, fraction)) * length);
  };

  const percent = (frame: number) => `${length > 0 ? (frame / length) * 100 : 0}%`;

  return (
    <div
      className="waveform"
      aria-hidden="true"
      onPointerDown={(event) => {
        if (event.button !== 0 || length === 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { x: event.clientX, frame: frameAt(event), moved: false };
      }}
      onPointerMove={(event) => {
        const state = drag.current;
        if (!state) return;
        if (!state.moved && Math.abs(event.clientX - state.x) < DRAG_THRESHOLD) return;
        state.moved = true;
        const frame = frameAt(event);
        onSelect({ start: Math.min(state.frame, frame), end: Math.max(state.frame, frame) });
      }}
      onPointerUp={() => {
        const state = drag.current;
        drag.current = undefined;
        if (state && !state.moved) {
          onSeek(state.frame);
          onSelect(undefined);
        }
      }}
      onPointerCancel={() => {
        drag.current = undefined;
      }}
    >
      <canvas ref={canvas} className="waveform-canvas" />
      {selection && (
        <div
          className="waveform-selection"
          style={{
            left: percent(selection.start),
            width: percent(selection.end - selection.start),
          }}
        />
      )}
      <div className="waveform-playhead" style={{ left: percent(playhead) }} />
    </div>
  );
}

/**
 * Draws each clip's part of its source from the session's peaks, never from
 * the samples, scaled by the clip's gain, so drawing costs the same for an
 * hour as for a minute. The colour is the canvas's own CSS `color`, so
 * themes and forced colours apply.
 */
function drawWaveform(canvas: HTMLCanvasElement, plan: AudioPlan, session: AudioSession) {
  const ratio = window.devicePixelRatio || 1;
  const width = Math.round(canvas.clientWidth * ratio);
  const height = Math.round(canvas.clientHeight * ratio);
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const total = planLength(plan);
  if (!context || width === 0 || total === 0) return;

  context.fillStyle = getComputedStyle(canvas).color;
  const middle = height / 2;
  const framesPerColumn = total / width;
  let offset = 0;

  for (const clip of plan.clips) {
    const length = clipLength(clip);
    const level = pickLevel(session.getPeaks(clip.source)?.levels ?? [], framesPerColumn);
    if (level) {
      const gain = dbToGain(clip.gainDb);
      const last = Math.min(width, Math.ceil((offset + length) / framesPerColumn));
      for (let column = Math.floor(offset / framesPerColumn); column < last; column++) {
        const from = clip.start + Math.max(0, column * framesPerColumn - offset);
        const to = clip.start + Math.min(length, (column + 1) * framesPerColumn - offset);
        const firstBucket = Math.floor(from / level.framesPerBucket);
        const lastBucket = Math.max(firstBucket + 1, Math.ceil(to / level.framesPerBucket));
        let low = 0;
        let high = 0;
        for (const channel of level.channels) {
          for (let bucket = firstBucket; bucket < lastBucket; bucket++) {
            low = Math.min(low, channel.min[bucket] ?? 0);
            high = Math.max(high, channel.max[bucket] ?? 0);
          }
        }
        const top = Math.min(1, high * gain);
        const bottom = Math.max(-1, low * gain);
        context.fillRect(column, middle - top * middle, 1, Math.max(1, (top - bottom) * middle));
      }
    }
    offset += length;
  }
}

/**
 * The coarsest level whose buckets still fit in one column, so each column
 * reads a few buckets at most; or the finest, when even that is wider.
 * Levels are ordered from the finest to the coarsest.
 */
function pickLevel(levels: readonly AudioPeakLevel[], framesPerColumn: number) {
  let picked = levels[0];
  for (const level of levels) {
    if (level.framesPerBucket <= framesPerColumn) picked = level;
  }
  return picked;
}
