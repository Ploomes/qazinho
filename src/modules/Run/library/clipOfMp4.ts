import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import { readMp4 } from '@/modules/Run/classes/video/ReplayComposer/library';

/** A stretch of an MP4's video as an MP4 of its own, its frames copied as they are from the key frame before it starts; null when the file holds no H.264 video to cut. */
export function clipOfMp4(props: {
  video: Uint8Array;
  fromMs: number;
  toMs: number;
}): Uint8Array | null {
  const track = readMp4(props.video);

  if (track === null) return null;

  const { samples } = track;
  const isReordered = samples.some(
    (sample, index) =>
      index > 0 && sample.timestampUs < (samples[index - 1]?.timestampUs ?? 0),
  );
  let decodeUs = 0;

  const frames = samples.map((sample) => {
    const frame = { ...sample, decodeUs };

    decodeUs += sample.durationUs;

    return frame;
  });
  const fromUs = props.fromMs * 1_000;
  const toUs = Math.max(props.toMs * 1_000, fromUs);
  const keyBefore = frames.findLastIndex(
    (frame) => frame.isKey && frame.timestampUs <= fromUs,
  );
  const start = keyBefore === -1 ? frames.findIndex((frame) => frame.isKey) : keyBefore;
  const kept =
    start === -1
      ? []
      : frames
          .slice(start)
          .filter((frame, index) => index === 0 || frame.decodeUs <= toUs);

  if (kept.length === 0) return null;

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width: track.width, height: track.height },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });

  kept.forEach((frame, index) => {
    muxer.addVideoChunkRaw(
      props.video.subarray(frame.offset, frame.offset + frame.size),
      frame.isKey ? 'key' : 'delta',
      frame.timestampUs,
      frame.durationUs,
      index === 0
        ? {
            decoderConfig: {
              codec: track.codec,
              codedWidth: track.width,
              codedHeight: track.height,
              description: track.description,
            },
          }
        : undefined,
      isReordered ? Math.max(0, frame.timestampUs - frame.decodeUs) : 0,
    );
  });
  muxer.finalize();

  return new Uint8Array(target.buffer);
}
