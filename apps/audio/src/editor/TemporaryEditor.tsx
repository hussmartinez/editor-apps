/**
 * TEMPORARY: a small editor that lives in the app only until
 * `@hussmartinez/audio-sdk` ships its own React editor, `AudioEditor`
 * (audio-sdk ADR 0005). The SDK's `./react` entry is still empty, so this
 * folder stands in for it, and is deleted when the app switches over.
 *
 * It has no editing logic of its own. It only draws and wires the SDK's
 * headless API and `@hussmartinez/ui` components:
 *
 * - every edit is a session command, so undo and redo are the session's;
 * - playback is the SDK's output, kept in step by `connectOutput`;
 * - export is `session.export()`, and the app only offers the download;
 * - the waveform is drawn from `session.getPeaks()`, never from samples;
 * - error text comes from the message catalogue by error code.
 *
 * Keys, range selection and labels follow ADR 0005 where they can, so the
 * switch changes little for people using it. Don't grow this: missing
 * features belong in the SDK's editor.
 */
import {
  type AudioSelection,
  type AudioWarning,
  isAudioError,
  planLength,
} from "@hussmartinez/audio-sdk";
import { createShortcutRegistry } from "@hussmartinez/sdk-core";
import {
  Button,
  CloseIcon,
  CropIcon,
  DeleteIcon,
  DownloadIcon,
  Field,
  FileDropZone,
  IconButton,
  NumberField,
  OpenIcon,
  PauseIcon,
  PlayIcon,
  ProgressBar,
  RedoIcon,
  SkipBackIcon,
  Slider,
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
  UndoIcon,
  useAnnounce,
  usePlatform,
} from "@hussmartinez/ui/react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { messages } from "../messages";
import { exportName, formatTime } from "./format";
import { type Audio, useAudio, usePlayhead, useStore } from "./useAudio";
import { Waveform } from "./Waveform";

/** A hint for the file picker and the drop zone. The SDK checks the contents. */
const ACCEPT = "audio/*,.wav,.aif,.aiff,.flac,.mp3,.aac,.m4a,.mp4,.ogg,.oga,.opus,.webm,.mka";

/** The keys of ADR 0005, matched by sdk-core's registry on the editor's root. */
const SHORTCUTS = [
  { id: "playPause", shortcuts: "play-pause" },
  { id: "undo", shortcuts: "undo" },
  { id: "redo", shortcuts: "redo" },
  { id: "delete", shortcuts: "delete" },
  { id: "setStart", shortcuts: ["I"] },
  { id: "setEnd", shortcuts: ["O"] },
  { id: "clearSelection", shortcuts: ["Escape"] },
  { id: "toStart", shortcuts: ["Home"] },
  { id: "toEnd", shortcuts: ["End"] },
] as const;

type ShortcutId = (typeof SHORTCUTS)[number]["id"];

interface Tool {
  readonly enabled: boolean;
  readonly run: () => void;
}

interface Task {
  readonly kind: "open" | "export";
  readonly fraction: number;
}

interface Download {
  readonly url: string;
  readonly name: string;
  readonly size: number;
}

export function TemporaryEditor() {
  const audio = useAudio();
  return audio ? <Editor session={audio.session} output={audio.output} /> : null;
}

function Editor({ session, output }: Audio) {
  const snapshot = useStore(session);
  const playing = useStore(output).state === "playing";
  const { plan, selection } = snapshot;
  const length = plan ? planLength(plan) : 0;
  const rate = plan?.sampleRate ?? 1;
  const [playhead, seek] = usePlayhead(output, playing, plan);

  const [task, setTask] = useState<Task>();
  const [notice, setNotice] = useState<string>();
  const [fileName, setFileName] = useState("");
  const [download, setDownload] = useState<Download>();
  const [focusRequest, focusPlayhead] = useReducer((count: number) => count + 1, 0);
  const controller = useRef<AbortController>(undefined);
  const downloadUrl = useRef<string>(undefined);
  const slider = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const announce = useAnnounce();
  const platform = usePlatform();
  const shortcuts = useMemo(
    () => createShortcutRegistry({ platform, tools: SHORTCUTS }),
    [platform],
  );
  const time = (frames: number) => formatTime(frames, rate);

  // Focus goes to the playhead after opening and after an edit that removes
  // the selection, so it never falls back to the page (ADR 0005, "Focus").
  useEffect(() => {
    if (focusRequest > 0) slider.current?.focus();
  }, [focusRequest]);

  useEffect(
    () => () => {
      controller.current?.abort();
      if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
    },
    [],
  );

  const forgetDownload = useCallback(() => {
    if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
    downloadUrl.current = undefined;
    setDownload(undefined);
  }, []);

  /** Runs an open or an export: one at a time, with progress, and Cancel aborts it. */
  const runTask = useCallback(
    async (
      kind: Task["kind"],
      work: (options: {
        signal: AbortSignal;
        onProgress: (fraction: number) => void;
      }) => Promise<void>,
    ) => {
      controller.current?.abort();
      const own = new AbortController();
      controller.current = own;
      setNotice(undefined);
      setTask({ kind, fraction: 0 });
      try {
        await work({
          signal: own.signal,
          onProgress: (fraction) => {
            if (controller.current === own) setTask({ kind, fraction });
          },
        });
      } catch (error) {
        if (!isAudioError(error, "ABORTED")) setNotice(messages.error(error));
      } finally {
        if (controller.current === own) {
          controller.current = undefined;
          setTask(undefined);
        }
      }
    },
    [],
  );

  const open = useCallback(
    (file: File) =>
      runTask("open", async (options) => {
        await session.open(file, options);
        setFileName(file.name);
        forgetDownload();
        announce(messages.t("editor.opened", { name: file.name }));
        focusPlayhead();
      }),
    [session, runTask, forgetDownload, announce],
  );

  const exportWav = () =>
    runTask("export", async (options) => {
      forgetDownload();
      const wav = await session.export(options);
      const name = exportName(fileName);
      const url = URL.createObjectURL(wav);
      downloadUrl.current = url;
      setDownload({ url, name, size: wav.size });
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      announce(messages.t("editor.exported", { name, size: wav.size }));
    });

  // While a recording is open, a file dropped anywhere on the page replaces
  // it. Before that, ui's FileDropZone takes drops and turns stray ones away.
  const hasRecording = plan !== undefined;
  useEffect(() => {
    if (!hasRecording) return;
    const allow = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
    };
    const drop = (event: DragEvent) => {
      const file = event.dataTransfer?.files[0];
      if (!file) return;
      event.preventDefault();
      void open(file);
    };
    window.addEventListener("dragover", allow);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragover", allow);
      window.removeEventListener("drop", drop);
    };
  }, [hasRecording, open]);

  /** Runs an edit. A command the session refuses shows the catalogue's text for its code. */
  const attempt = (edit: () => void) => {
    try {
      edit();
      setNotice(undefined);
    } catch (error) {
      setNotice(messages.error(error));
    }
  };

  const select = (range: AudioSelection | undefined) => {
    session.select(range);
    if (range && range.end > range.start) {
      announce(messages.t("editor.selection", { start: time(range.start), end: time(range.end) }));
    }
  };

  const idle = plan !== undefined && task === undefined;
  const tools: Record<ShortcutId | "trim", Tool> = {
    playPause: {
      enabled: length > 0,
      run: () => {
        if (playing) output.pause();
        else output.play().catch((error: unknown) => setNotice(messages.error(error)));
      },
    },
    toStart: { enabled: length > 0, run: () => seek(0) },
    toEnd: { enabled: length > 0, run: () => seek(length) },
    undo: {
      enabled: idle && snapshot.canUndo,
      run: () =>
        attempt(() => {
          session.undo();
          announce(messages.t("editor.undone"));
        }),
    },
    redo: {
      enabled: idle && snapshot.canRedo,
      run: () =>
        attempt(() => {
          session.redo();
          announce(messages.t("editor.redone"));
        }),
    },
    setStart: {
      enabled: plan !== undefined && playhead < length,
      run: () =>
        select({
          start: playhead,
          end: selection && selection.end > playhead ? selection.end : length,
        }),
    },
    setEnd: {
      enabled: plan !== undefined && playhead > 0,
      run: () =>
        select({
          start: selection && selection.start < playhead ? selection.start : 0,
          end: playhead,
        }),
    },
    clearSelection: { enabled: selection !== undefined, run: () => session.select(undefined) },
    delete: {
      enabled: idle && selection !== undefined,
      run: () => {
        if (!selection) return;
        attempt(() => {
          session.execute({ type: "audio.deleteRange", ...selection, newKey: session.createKey() });
          session.select(undefined);
          seek(selection.start);
          announce(
            messages.t("editor.deleted", {
              start: time(selection.start),
              end: time(selection.end),
            }),
          );
          focusPlayhead();
        });
      },
    },
    trim: {
      enabled: idle && selection !== undefined && (selection.start > 0 || selection.end < length),
      run: () => {
        if (!selection) return;
        attempt(() => {
          // Two range deletions, after and then before the selection, as one undo step.
          session.group(() => {
            for (const [start, end] of [
              [selection.end, length],
              [0, selection.start],
            ] as const) {
              if (end > start) {
                session.execute({
                  type: "audio.deleteRange",
                  start,
                  end,
                  newKey: session.createKey(),
                });
              }
            }
          });
          session.select(undefined);
          seek(0);
          announce(
            messages.t("editor.trimmed", { duration: time(selection.end - selection.start) }),
          );
          focusPlayhead();
        });
      },
    },
  };

  const setGain = (gainDb: number) => {
    const keys = plan?.clips.filter((clip) => clip.gainDb !== gainDb).map((clip) => clip.key);
    if (keys?.length) attempt(() => session.execute({ type: "audio.setGain", keys, gainDb }));
  };

  // The slider counts steps of 10 ms, as ADR 0005's playhead does, so its
  // last step can be the plan's very end whatever the length.
  const step = Math.max(1, Math.round(rate / 100));
  const steps = Math.ceil(length / step);

  const toolButton = (id: keyof typeof tools, label: string, icon?: ReactNode) => (
    <Button
      variant="quiet"
      startIcon={icon}
      disabled={!tools[id].enabled}
      focusableWhenDisabled
      aria-keyshortcuts={id === "trim" ? undefined : shortcuts.ariaKeyShortcuts(id)}
      onClick={tools[id].run}
    >
      {label}
    </Button>
  );

  return (
    <section
      className="editor"
      aria-label={messages.t("editor.label")}
      onKeyDown={(event) => {
        const id = shortcuts.match(event.nativeEvent, { root: event.currentTarget });
        const tool = tools[id as ShortcutId];
        if (tool?.enabled) {
          event.preventDefault();
          tool.run();
        }
      }}
    >
      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void open(file);
        }}
      />

      {plan && (
        <Toolbar label={messages.t("editor.tools")}>
          <ToolbarGroup label={messages.t("editor.tools.file")}>
            <Button
              variant="quiet"
              startIcon={<OpenIcon />}
              onClick={() => fileInput.current?.click()}
            >
              {messages.t("editor.open")}
            </Button>
            <Button
              variant="quiet"
              startIcon={<DownloadIcon />}
              disabled={!idle || length === 0}
              focusableWhenDisabled
              onClick={exportWav}
            >
              {messages.t("editor.export")}
            </Button>
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup label={messages.t("editor.tools.history")}>
            {toolButton("undo", messages.t("editor.undo"), <UndoIcon />)}
            {toolButton("redo", messages.t("editor.redo"), <RedoIcon />)}
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup label={messages.t("editor.tools.selection")}>
            {toolButton("setStart", messages.t("editor.setStart"))}
            {toolButton("setEnd", messages.t("editor.setEnd"))}
            {toolButton("delete", messages.t("editor.delete"), <DeleteIcon />)}
            {toolButton("trim", messages.t("editor.trim"), <CropIcon />)}
          </ToolbarGroup>
        </Toolbar>
      )}

      {notice && (
        <div className="editor-notice" role="alert">
          <p>{notice}</p>
          <IconButton
            variant="quiet"
            size="small"
            label={messages.t("editor.dismiss")}
            icon={<CloseIcon />}
            onClick={() => setNotice(undefined)}
          />
        </div>
      )}

      {snapshot.warnings.length > 0 && (
        <ul className="editor-warnings">
          {snapshot.warnings.map((warning) => (
            <li key={`${warning.type}:${warningKey(warning)}`}>{warningText(warning)}</li>
          ))}
        </ul>
      )}

      {task && (
        <div className="editor-task">
          <ProgressBar
            value={task.fraction}
            max={1}
            label={messages.t(task.kind === "open" ? "editor.opening" : "editor.exporting")}
          />
          <Button size="small" onClick={() => controller.current?.abort()}>
            {messages.t("editor.cancel")}
          </Button>
        </div>
      )}

      {plan ? (
        <>
          <Waveform
            session={session}
            plan={plan}
            selection={selection}
            playhead={playhead}
            onSeek={seek}
            onSelect={(range) => session.select(range)}
          />
          <Slider
            ref={slider}
            label={messages.t("editor.playhead")}
            min={0}
            max={steps}
            largeStep={100}
            value={playhead >= length ? steps : Math.floor(playhead / step)}
            onValueChange={(value) => seek(Math.min(length, value * step))}
            formatValue={(value) => time(Math.min(length, value * step))}
            onKeyDown={(event) => {
              // Shift with the arrow keys extends the selection from the playhead.
              const direction = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
              if (!event.shiftKey || direction === undefined) return;
              event.preventDefault();
              const to = Math.min(length, Math.max(0, playhead + direction * step));
              const anchor =
                selection?.start === playhead
                  ? selection.end
                  : selection?.end === playhead
                    ? selection.start
                    : playhead;
              seek(to);
              select({ start: Math.min(anchor, to), end: Math.max(anchor, to) });
            }}
          />
          <div className="editor-transport">
            <IconButton
              variant="primary"
              label={messages.t(playing ? "editor.pause" : "editor.play")}
              icon={playing ? <PauseIcon /> : <PlayIcon />}
              disabled={!tools.playPause.enabled}
              focusableWhenDisabled
              aria-keyshortcuts={shortcuts.ariaKeyShortcuts("playPause")}
              onClick={tools.playPause.run}
            />
            <IconButton
              label={messages.t("editor.toStart")}
              icon={<SkipBackIcon />}
              disabled={!tools.toStart.enabled}
              focusableWhenDisabled
              aria-keyshortcuts={shortcuts.ariaKeyShortcuts("toStart")}
              onClick={tools.toStart.run}
            />
            <p className="editor-time">
              {messages.t("editor.time", { position: time(playhead), duration: time(length) })}
            </p>
            <p className="editor-selection">
              {selection
                ? messages.t("editor.selection", {
                    start: time(selection.start),
                    end: time(selection.end),
                  })
                : messages.t("editor.selection.none")}
            </p>
          </div>
          <p className="editor-summary">
            {messages.t("editor.summary", {
              name: fileName,
              duration: time(length),
              sampleRate: plan.sampleRate,
              channels: plan.channels,
            })}
          </p>
          <Field
            className="editor-gain"
            label={messages.t("editor.gain")}
            description={messages.t("editor.gain.description")}
          >
            <NumberField
              min={-24}
              max={24}
              value={plan.clips[0]?.gainDb ?? 0}
              disabled={!idle || length === 0}
              onValueChange={setGain}
              format={(db) => messages.t("editor.gain.value", { db })}
              parse={(text) => {
                const db = Number.parseFloat(text.replace("−", "-"));
                return Number.isNaN(db) ? undefined : db;
              }}
            />
          </Field>
          {download && (
            <p className="editor-download">
              {messages.t("editor.exported", { name: download.name, size: download.size })}{" "}
              <a href={download.url} download={download.name}>
                {messages.t("editor.download")}
              </a>
            </p>
          )}
        </>
      ) : (
        <FileDropZone
          className="editor-empty"
          accept={ACCEPT}
          disabled={task !== undefined}
          onFiles={([file]) => {
            if (file) void open(file);
          }}
          onFilesRejected={([rejection]) => {
            if (rejection) setNotice(messages.t(`editor.rejected.${rejection.reason}`));
          }}
        >
          <h2>{messages.t("editor.empty.title")}</h2>
          <p>{messages.t("editor.empty.formats")}</p>
        </FileDropZone>
      )}
    </section>
  );
}

function warningKey(warning: AudioWarning): string {
  return warning.type === "limit" ? `${warning.limit}:${warning.source ?? ""}` : warning.source;
}

/**
 * A warning's text, from `warnings.<name>` in the catalogue. Some limits'
 * texts take the value and others take nothing, which the catalogue's types
 * can't express for a name known only at run time, hence the wider type.
 */
function warningText(warning: AudioWarning): string {
  if (warning.type === "truncated") return messages.t("warnings.truncated");
  const catalogue: { t(key: string, params: { actual: number }): string } = messages;
  return catalogue.t(`warnings.${warning.limit}`, { actual: warning.actual });
}
