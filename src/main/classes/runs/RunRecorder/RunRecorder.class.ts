import type { IOpenRecording, RecorderPage } from './types';
import type {
  IRecordingChunk,
  IRecordingDone,
  IRecordingStart,
  IRecordingStop,
  IRunVideo,
} from '@/shared/types';
import type { WebContents } from 'electron';
import { mkdir, open, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { BrowserWindow, ipcMain } from 'electron';
import { ARCHIVE } from '@/main/classes/storage/Archive/constants';
import { CHANNELS, RECORDER_ARGUMENT } from '@/shared/constants';
import { RUN_RECORDER } from './constants';

/** Records each run's live stream into an MP4 beside its screenshots, through a hidden window that has the video encoder. */
export class RunRecorder {
  private readonly dataRoot: string;
  private readonly preload: string;
  private readonly page: RecorderPage;
  private readonly recordings = new Map<string, IOpenRecording>();
  private window: BrowserWindow | null = null;
  private opening: Promise<BrowserWindow> | null = null;

  public constructor(props: { dataRoot: string; preload: string; page: RecorderPage }) {
    this.dataRoot = props.dataRoot;
    this.preload = props.preload;
    this.page = props.page;

    ipcMain.handle(CHANNELS.recorderWrite, (event, chunk: IRecordingChunk) =>
      this.write({ sender: event.sender, chunk }),
    );
    ipcMain.on(CHANNELS.recorderDone, (event, done: IRecordingDone) => {
      this.settle({ sender: event.sender, done });
    });
  }

  /** Whether a window is the hidden recorder, which the app's own windows leave out. */
  public owns(window: BrowserWindow): boolean {
    return window === this.window;
  }

  /** Starts recording a run's device from its live stream, into the run's own folder. */
  public async start(props: {
    workspaceId: string;
    runId: string;
    url: string;
  }): Promise<void> {
    if (this.recordings.has(props.workspaceId)) return;

    const file = join(
      this.dataRoot,
      ARCHIVE.runs,
      props.workspaceId,
      props.runId,
      ARCHIVE.videos.mp4,
    );

    await mkdir(dirname(file), { recursive: true });

    const handle = await open(file, 'w');
    let settle: (video: IRunVideo | null) => void = () => undefined;
    const done = new Promise<IRunVideo | null>((resolve) => {
      settle = resolve;
    });
    const id = `${props.workspaceId}/${props.runId}`;

    this.recordings.set(props.workspaceId, {
      id,
      file,
      handle,
      writes: Promise.resolve(),
      done,
      settle,
    });

    const start: IRecordingStart = { id, url: props.url };

    await this.open().then(
      (window) => {
        window.webContents.send(CHANNELS.recorderStart, start);
      },
      () => {
        settle(null);
      },
    );
  }

  /** Ends a run's recording now, and answers with its video once the file is whole, or null when there is none. */
  public async stop(workspaceId: string): Promise<IRunVideo | null> {
    const recording = this.recordings.get(workspaceId);

    if (!recording) return null;

    const stop: IRecordingStop = { id: recording.id, at: Date.now() };

    await this.opening?.catch(() => undefined);

    this.window?.webContents.send(CHANNELS.recorderStop, stop);

    const video = await Promise.race([
      recording.done,
      new Promise<null>((wake) => {
        setTimeout(() => {
          wake(null);
        }, RUN_RECORDER.doneWaitMs);
      }),
    ]);

    await recording.writes;
    await recording.handle.close();
    this.recordings.delete(workspaceId);

    if (video === null) await rm(recording.file, { force: true });

    if (this.recordings.size === 0) this.close();

    return video;
  }

  private async write(props: {
    sender: WebContents;
    chunk: IRecordingChunk;
  }): Promise<void> {
    const recording = this.recordingFrom({ sender: props.sender, id: props.chunk.id });

    if (!recording) return;

    const { data, position } = props.chunk;

    recording.writes = recording.writes.then(async () => {
      await recording.handle.write(data, 0, data.length, position);
    });

    await recording.writes;
  }

  private settle(props: { sender: WebContents; done: IRecordingDone }): void {
    this.recordingFrom({ sender: props.sender, id: props.done.id })?.settle(
      props.done.video,
    );
  }

  private recordingFrom(props: {
    sender: WebContents;
    id: string;
  }): IOpenRecording | null {
    if (props.sender !== this.window?.webContents) return null;

    return [...this.recordings.values()].find(({ id }) => id === props.id) ?? null;
  }

  private async open(): Promise<BrowserWindow> {
    if (this.window && !this.window.isDestroyed()) return this.window;

    this.opening ??= this.create();

    return this.opening;
  }

  private async create(): Promise<BrowserWindow> {
    const window = new BrowserWindow({
      show: false,
      skipTaskbar: true,
      width: 320,
      height: 240,
      webPreferences: {
        preload: this.preload,
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false,
        backgroundThrottling: false,
        additionalArguments: [RECORDER_ARGUMENT],
      },
    });

    window.webContents.on('will-navigate', (event) => {
      event.preventDefault();
    });
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('render-process-gone', () => {
      for (const recording of this.recordings.values()) recording.settle(null);

      this.window = null;
    });

    this.window = window;

    try {
      await ('url' in this.page
        ? window.loadURL(this.page.url)
        : window.loadFile(this.page.file));
    } finally {
      this.opening = null;
    }

    return window;
  }

  private close(): void {
    if (this.window && !this.window.isDestroyed()) this.window.destroy();

    this.window = null;
  }
}
