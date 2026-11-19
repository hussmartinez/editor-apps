import {
  type AudioOutput,
  type AudioPlan,
  type AudioSession,
  connectOutput,
  createAudioEngine,
  createAudioOutput,
  createAudioProcessor,
  createAudioSession,
} from "@hussmartinez/audio-sdk";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

export interface Audio {
  readonly session: AudioSession;
  readonly output: AudioOutput;
}

/**
 * Creates the SDK's session and output, and keeps playback following the
 * session with `connectOutput`. Everything is made in an effect and released
 * in its cleanup, so StrictMode's second mount gets fresh ones and there's
 * never more than one `AudioContext`.
 */
export function useAudio(): Audio | undefined {
  const [audio, setAudio] = useState<Audio>();

  useEffect(() => {
    // The worker comes from the app's own origin, for `worker-src 'self'`.
    const assets = { assetsUrl: __SDK_ASSETS_URL__ };
    const engine = createAudioEngine(assets);
    const processor = createAudioProcessor(assets);
    const session = createAudioSession({ engine, processor });
    const output = createAudioOutput();
    const disconnect = connectOutput(session, output);
    setAudio({ session, output });

    return () => {
      setAudio(undefined);
      disconnect();
      const ignore = () => undefined;
      output.destroy().catch(ignore);
      session
        .close()
        .catch(ignore)
        .finally(() => {
          engine.destroy().catch(ignore);
          processor.destroy().catch(ignore);
        });
    };
  }, []);

  return audio;
}

/**
 * The playhead, in frames. The output keeps it outside its snapshot, so this
 * reads `position()` on animation frames while playing, and again whenever
 * the plan or the playing state changes, which can both move it.
 */
export function usePlayhead(output: AudioOutput, playing: boolean, plan: AudioPlan | undefined) {
  const [frame, setFrame] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new plan can move the playhead.
  useEffect(() => {
    const read = () => setFrame(Math.round(output.position()));
    read();
    if (!playing) return;
    let request = requestAnimationFrame(function tick() {
      read();
      request = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(request);
  }, [output, playing, plan]);

  const seek = useCallback(
    (to: number) => {
      output.seek(to);
      setFrame(Math.round(output.position()));
    },
    [output],
  );

  return [frame, seek] as const;
}

/** Binds a store of the SDK, the session or the output, to React. */
export function useStore<Snapshot>(store: {
  subscribe(listener: () => void): () => void;
  getSnapshot(): Snapshot;
}): Snapshot {
  const subscribe = useCallback((listener: () => void) => store.subscribe(listener), [store]);
  return useSyncExternalStore(subscribe, () => store.getSnapshot());
}
