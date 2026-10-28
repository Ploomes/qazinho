import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import { describe, expect, it } from 'vitest';
import { readMp4 } from '@/modules/Run/classes/video/ReplayComposer/library';

/**
 * Um AVCDecoderConfigurationRecord para o perfil High, nível 4.0, como o codificador do
 * gravador entrega um.
 */
const AVCC = new Uint8Array([
  1, 0x64, 0x00, 0x28, 0xff, 0xe1, 0x00, 0x04, 0x67, 0x64, 0x00, 0x28, 0x01, 0x00, 0x02,
  0x68, 0xee,
]);

interface IFrame {
  atUs: number;
  isKey: boolean;
  bytes: number[];
}

/**
 * Um MP4 escrito do jeito que o gravador escreve: frames H.264 nos momentos em que foram
 * capturados.
 */
function mp4(props: { frames: IFrame[]; fastStart: false | 'in-memory' }): Uint8Array {
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width: 640, height: 400 },
    fastStart: props.fastStart,
    firstTimestampBehavior: 'offset',
  });

  props.frames.forEach((frame, index) => {
    const next = props.frames[index + 1];

    muxer.addVideoChunkRaw(
      new Uint8Array(frame.bytes),
      frame.isKey ? 'key' : 'delta',
      frame.atUs,
      (next?.atUs ?? frame.atUs + 100_000) - frame.atUs,
      index === 0
        ? {
            decoderConfig: {
              codec: 'avc1.640028',
              codedWidth: 640,
              codedHeight: 400,
              description: AVCC,
            },
          }
        : undefined,
    );
  });
  muxer.finalize();

  return new Uint8Array(target.buffer);
}

const FRAMES: IFrame[] = [
  { atUs: 0, isKey: true, bytes: [1, 2, 3, 4, 5] },
  { atUs: 100_000, isKey: false, bytes: [6, 7] },
  { atUs: 2_500_000, isKey: false, bytes: [8, 9, 10] },
  { atUs: 2_600_000, isKey: true, bytes: [11, 12, 13, 14] },
];

describe('readMp4', () => {
  it('reads each frame back where the recorder wrote it, with its time and whether it is a key', () => {
    const bytes = mp4({ frames: FRAMES, fastStart: false });
    const track = readMp4(bytes);

    expect(
      track?.samples.map((sample) => ({
        bytes: [...bytes.subarray(sample.offset, sample.offset + sample.size)],
        atUs: sample.timestampUs,
        isKey: sample.isKey,
      })),
    ).toEqual(FRAMES);
  });

  it('reads a file whose index comes first just the same', () => {
    const track = readMp4(mp4({ frames: FRAMES, fastStart: 'in-memory' }));

    expect(track?.samples.map(({ timestampUs }) => timestampUs)).toEqual([
      0, 100_000, 2_500_000, 2_600_000,
    ]);
  });

  it('names the codec the way a decoder asks for it, with its configuration and size', () => {
    const track = readMp4(mp4({ frames: FRAMES, fastStart: false }));

    expect(track).toMatchObject({ codec: 'avc1.640028', width: 640, height: 400 });
    expect([...(track?.description ?? [])]).toEqual([...AVCC]);
  });

  it('says how long each frame stays, up to the next one', () => {
    const track = readMp4(mp4({ frames: FRAMES, fastStart: false }));

    expect(track?.samples.slice(0, 3).map(({ durationUs }) => durationUs)).toEqual([
      100_000, 2_400_000, 100_000,
    ]);
  });

  it('finds no video in bytes that are not an MP4, or in one cut before its index', () => {
    const whole = mp4({ frames: FRAMES, fastStart: false });

    expect(
      readMp4(new Uint8Array([0, 0, 0, 8, 0x66, 0x72, 0x65, 0x65, 9, 9])),
    ).toBeNull();
    expect(readMp4(whole.subarray(0, whole.byteLength - 40))).toBeNull();
    expect(readMp4(new Uint8Array(0))).toBeNull();
  });
});
