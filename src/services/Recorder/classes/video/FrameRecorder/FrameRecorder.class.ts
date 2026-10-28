import type { IMjpegPart } from './types';
import type { IRecordingChunk, IRunVideo } from '@/shared/types';
import { Muxer, StreamTarget } from 'mp4-muxer';
import { FRAME_RECORDER } from './constants';
import { cropOf, encodedSizeOf, fitInto, joinBytes, takeMjpegPart } from './library';

/**
 * Grava uma run: lê o stream vivo do dispositivo, codifica cada frame como H.264 no
 * momento em que foi capturado, e entrega o MP4 em pedaços.
 */
export class FrameRecorder {
  private readonly id: string;
  private readonly url: string;
  private readonly send: (chunk: IRecordingChunk) => Promise<void>;
  private readonly reading = new AbortController();
  private readonly writes: Promise<void>[] = [];
  private encoder: VideoEncoder | null = null;
  private muxer: Muxer<StreamTarget> | null = null;
  private canvas: OffscreenCanvas | null = null;
  private startedAt: number | null = null;
  private queuedAt = Number.NEGATIVE_INFINITY;
  private keyAt = Number.NEGATIVE_INFINITY;
  private lastAt = Number.NEGATIVE_INFINITY;
  private lastTimestamp = -1;
  private pending: IMjpegPart | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private work: Promise<void> = Promise.resolve();
  private isBroken = false;

  public constructor(props: {
    id: string;
    url: string;
    send: (chunk: IRecordingChunk) => Promise<void>;
  }) {
    this.id = props.id;
    this.url = props.url;
    this.send = props.send;
  }

  /**
   * Lê o stream vivo até a run terminá-lo, mantendo no máximo um frame a cada `minGapMs`
   * e sempre o mais recente.
   */
  public async start(): Promise<void> {
    const response = await fetch(this.url, { signal: this.reading.signal }).catch(
      () => null,
    );
    const reader = response?.body?.getReader();

    if (!reader) return;

    let buffered: Uint8Array = new Uint8Array(0);

    for (;;) {
      const read = await reader.read().catch(() => null);

      if (read === null || read.done) return;

      buffered = joinBytes(buffered, read.value);

      for (;;) {
        const taken = takeMjpegPart(buffered);

        if (taken === null) break;

        buffered = taken.rest;

        if (taken.part !== null) this.accept(taken.part);
      }
    }
  }

  /**
   * Termina a gravação em `at`, segurando a última imagem até lá, e responde com o vídeo,
   * ou null quando não há.
   */
  public async stop(at: number): Promise<IRunVideo | null> {
    this.reading.abort();

    if (this.timer !== null) clearTimeout(this.timer);

    this.timer = null;
    this.flush();
    await this.work;

    const { encoder, muxer, canvas, startedAt } = this;

    if (encoder === null || muxer === null || canvas === null || startedAt === null) {
      encoder?.close();

      return null;
    }

    try {
      if (!this.isBroken && at > this.lastAt) this.frame(at);

      await encoder.flush();
      encoder.close();

      if (this.isBroken) return null;

      muxer.finalize();
      await Promise.all(this.writes);
    } catch {
      return null;
    }

    return {
      startedAt,
      durationMs: Math.max(0, at - startedAt),
      width: canvas.width,
      height: canvas.height,
    };
  }

  private accept(part: IMjpegPart): void {
    this.pending = part;

    if (this.timer !== null) return;

    this.timer = setTimeout(
      () => {
        this.timer = null;
        this.flush();
      },
      Math.max(0, this.queuedAt + FRAME_RECORDER.minGapMs - part.at),
    );
  }

  private flush(): void {
    const part = this.pending;

    this.pending = null;

    if (part === null) return;

    this.queuedAt = part.at;
    this.work = this.work
      .then(async () => {
        await this.encode(part);
      })
      .catch(() => {
        this.isBroken = true;
      });
  }

  private async encode(part: IMjpegPart): Promise<void> {
    if (this.isBroken) return;

    const bitmap = await createImageBitmap(new Blob([part.jpeg], { type: 'image/jpeg' }));

    try {
      const crop = cropOf({
        width: bitmap.width,
        height: bitmap.height,
        ratio: part.ratio,
      });
      const canvas = this.canvas ?? (await this.begin({ size: crop, at: part.at }));
      const context = canvas.getContext('2d');

      if (context === null) throw new Error('The recorder has no canvas to draw on.');

      const fit = fitInto({ source: crop, box: canvas });

      context.fillStyle = FRAME_RECORDER.letterbox;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        bitmap,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        fit.x,
        fit.y,
        fit.width,
        fit.height,
      );
      this.frame(part.at);
    } finally {
      bitmap.close();
    }
  }

  private async begin(props: {
    size: { width: number; height: number };
    at: number;
  }): Promise<OffscreenCanvas> {
    const size = encodedSizeOf({ ...props.size, maxSide: FRAME_RECORDER.maxSide });
    const config: VideoEncoderConfig = {
      codec: FRAME_RECORDER.codec,
      width: size.width,
      height: size.height,
      bitrate: FRAME_RECORDER.bitrate,
      framerate: FRAME_RECORDER.frameRate,
      hardwareAcceleration: 'prefer-hardware',
      avc: { format: 'avc' },
    };
    const support = await VideoEncoder.isConfigSupported(config);

    if (support.supported !== true)
      throw new Error('This machine cannot encode the run as H.264.');

    const muxer = new Muxer({
      target: new StreamTarget({
        onData: (data, position) => {
          this.writes.push(this.send({ id: this.id, position, data }));
        },
        chunked: true,
        chunkSize: FRAME_RECORDER.chunkBytes,
      }),
      video: { codec: 'avc', width: size.width, height: size.height },
      fastStart: false,
      firstTimestampBehavior: 'offset',
    });
    const encoder = new VideoEncoder({
      output: (chunk, meta) => {
        muxer.addVideoChunk(chunk, meta);
      },
      error: () => {
        this.isBroken = true;
      },
    });

    encoder.configure(config);
    this.muxer = muxer;
    this.encoder = encoder;
    this.canvas = new OffscreenCanvas(size.width, size.height);
    this.startedAt = props.at;

    return this.canvas;
  }

  private frame(at: number): void {
    const { encoder, canvas, startedAt } = this;

    if (encoder === null || canvas === null || startedAt === null) return;

    const timestamp = Math.max(
      this.lastTimestamp + 1,
      Math.round((at - startedAt) * 1000),
    );
    const isKey = at - this.keyAt >= FRAME_RECORDER.keyEveryMs;
    const frame = new VideoFrame(canvas, { timestamp });

    encoder.encode(frame, { keyFrame: isKey });
    frame.close();

    if (isKey) this.keyAt = at;

    this.lastAt = at;
    this.lastTimestamp = timestamp;
  }
}
