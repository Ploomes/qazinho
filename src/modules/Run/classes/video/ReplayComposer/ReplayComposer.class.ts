import type { IComposeJob, IComposeLayout, IComposeReplay } from './types';
import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import { REPLAY_COMPOSER } from './constants';
import { composeLayoutOf, drawNetworkStrip, fillersBetween, readMp4 } from './library';

/**
 * Desenha a rede de uma run sob o vídeo dela: decodifica a gravação frame a frame,
 * acrescenta a faixa como o vídeo estava em cada momento, e codifica tudo num MP4.
 */
export class ReplayComposer {
  private readonly props: IComposeReplay;
  private failure: DOMException | null = null;
  private shownUs = -1;
  private keyAtUs = Number.NEGATIVE_INFINITY;
  private reported = 0;

  public constructor(props: IComposeReplay) {
    this.props = props;
  }

  /**
   * O vídeo com a rede embaixo, como os bytes de um MP4; lança erro quando o vídeo não
   * pode ser lido ou codificado aqui, ou quando o QA o fechou.
   */
  public async compose(): Promise<Uint8Array> {
    const { video, signal } = this.props;
    const track = readMp4(video);

    if (track === null) throw new Error('The run’s video is not one QAzinho can read.');

    const decoding: VideoDecoderConfig = {
      codec: track.codec,
      description: track.description,
      codedWidth: track.width,
      codedHeight: track.height,
    };

    if ((await VideoDecoder.isConfigSupported(decoding)).supported !== true)
      throw new Error('This machine cannot decode the run’s video.');

    await Promise.all(REPLAY_COMPOSER.fonts.map((font) => document.fonts.load(font)));

    const layout = composeLayoutOf({ width: track.width, height: track.height });
    const canvas = new OffscreenCanvas(layout.width, layout.height);
    const context = canvas.getContext('2d');
    const layer = new OffscreenCanvas(track.width, track.height).getContext('2d');

    if (context === null || layer === null)
      throw new Error('This machine has no canvas to draw the video on.');

    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: { codec: 'avc', width: layout.width, height: layout.height },
      fastStart: 'in-memory',
      firstTimestampBehavior: 'offset',
    });
    const encoder = new VideoEncoder({
      output: (chunk, meta) => {
        muxer.addVideoChunk(chunk, meta);
      },
      error: (reason) => {
        this.failure = reason;
      },
    });
    const job: IComposeJob = { canvas, context, layer, layout, encoder };
    const decoder = new VideoDecoder({
      output: (frame) => {
        this.take({ job, frame });
      },
      error: (reason) => {
        this.failure = reason;
      },
    });

    try {
      encoder.configure(await this.encoding(layout));
      decoder.configure(decoding);

      for (const sample of track.samples) {
        if (signal.aborted || this.failure !== null || decoder.state === 'closed') break;

        decoder.decode(
          new EncodedVideoChunk({
            type: sample.isKey ? 'key' : 'delta',
            timestamp: sample.timestampUs,
            duration: sample.durationUs,
            data: video.subarray(sample.offset, sample.offset + sample.size),
          }),
        );
        await this.room({ decoder, encoder });
      }

      if (!signal.aborted && this.failure === null) await decoder.flush();

      for (const atUs of fillersBetween({
        fromUs: this.shownUs,
        toUs: this.props.durationMs * 1_000,
        stepUs: REPLAY_COMPOSER.stepUs,
      }))
        if (this.shownUs >= 0 && !signal.aborted && this.failure === null)
          this.emit({ job, atUs });

      if (!signal.aborted && this.failure === null) await encoder.flush();
    } finally {
      if (decoder.state !== 'closed') decoder.close();

      if (encoder.state !== 'closed') encoder.close();
    }

    if (signal.aborted) throw new DOMException('The QA closed the video.', 'AbortError');

    if (this.failure !== null) throw this.failure;

    if (this.shownUs < 0) throw new Error('The run’s video had no frame to draw.');

    muxer.finalize();
    this.props.onProgress(1);

    return new Uint8Array(target.buffer);
  }

  private async encoding(layout: IComposeLayout): Promise<VideoEncoderConfig> {
    for (const codec of REPLAY_COMPOSER.codecs)
      for (const hardwareAcceleration of REPLAY_COMPOSER.acceleration) {
        const config: VideoEncoderConfig = {
          codec,
          width: layout.width,
          height: layout.height,
          bitrate: REPLAY_COMPOSER.bitrate,
          framerate: REPLAY_COMPOSER.frameRate,
          hardwareAcceleration,
          avc: { format: 'avc' },
        };

        if ((await VideoEncoder.isConfigSupported(config)).supported === true)
          return config;
      }

    throw new Error('This machine cannot encode the video as H.264.');
  }

  private async room(props: {
    decoder: VideoDecoder;
    encoder: VideoEncoder;
  }): Promise<void> {
    const { decoder, encoder } = props;

    while (
      this.failure === null &&
      !this.props.signal.aborted &&
      (decoder.decodeQueueSize > REPLAY_COMPOSER.queueLimit ||
        encoder.encodeQueueSize > REPLAY_COMPOSER.queueLimit)
    )
      await new Promise((resolve) => setTimeout(resolve, REPLAY_COMPOSER.waitMs));
  }

  private take(props: { job: IComposeJob; frame: VideoFrame }): void {
    const { job, frame } = props;

    if (this.failure !== null || this.props.signal.aborted) {
      frame.close();

      return;
    }

    const atUs = Math.max(frame.timestamp, this.shownUs + 1);

    if (this.shownUs >= 0)
      for (const filler of fillersBetween({
        fromUs: this.shownUs,
        toUs: atUs,
        stepUs: REPLAY_COMPOSER.stepUs,
      }))
        this.emit({ job, atUs: filler });

    job.layer.drawImage(frame, 0, 0, job.layout.video.width, job.layout.video.height);
    frame.close();
    this.emit({ job, atUs });
  }

  private emit(props: { job: IComposeJob; atUs: number }): void {
    const { job, atUs } = props;
    const { context, layout } = job;
    const { requests, isShowingFiles, look, words, durationMs, onProgress } = this.props;
    const isKey = atUs - this.keyAtUs >= REPLAY_COMPOSER.keyEveryUs;

    context.fillStyle = look.screen;
    context.fillRect(0, 0, layout.width, layout.strip.y);
    context.drawImage(
      job.layer.canvas,
      layout.video.x,
      layout.video.y,
      layout.video.width,
      layout.video.height,
    );
    drawNetworkStrip({
      context,
      box: layout.strip,
      scale: layout.scale,
      requests,
      atMs: atUs / 1_000,
      isShowingFiles,
      look,
      words,
    });

    const frame = new VideoFrame(job.canvas, {
      timestamp: atUs,
      duration: REPLAY_COMPOSER.stepUs,
    });

    job.encoder.encode(frame, { keyFrame: isKey });
    frame.close();

    if (isKey) this.keyAtUs = atUs;

    this.shownUs = atUs;

    const share = durationMs > 0 ? Math.min(1, atUs / 1_000 / durationMs) : 1;

    if (share - this.reported >= REPLAY_COMPOSER.progressStep) {
      this.reported = share;
      onProgress(share);
    }
  }
}
