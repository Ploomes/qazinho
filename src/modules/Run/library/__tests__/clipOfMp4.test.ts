import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import { describe, expect, it } from 'vitest';
import { readMp4 } from '@/modules/Run/classes/video/ReplayComposer/library';
import { clipOfMp4 } from '@/modules/Run/library';

/**
 * Um AVCDecoderConfigurationRecord para o perfil High, nível 4.0, como o codificador do
 * gravador entrega um.
 */
const AVCC = new Uint8Array([
  1, 0x64, 0x00, 0x28, 0xff, 0xe1, 0x00, 0x04, 0x67, 0x64, 0x00, 0x28, 0x01, 0x00, 0x02,
  0x68, 0xee,
]);

/**
 * Uma gravação como o gravador a escreve: um frame por segundo, um key frame a cada
 * quatro, os bytes de cada frame sendo o próprio número.
 */
function recording(seconds: number): Uint8Array {
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width: 640, height: 400 },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });

  for (let second = 0; second < seconds; second += 1)
    muxer.addVideoChunkRaw(
      new Uint8Array([second, second]),
      second % 4 === 0 ? 'key' : 'delta',
      second * 1_000_000,
      1_000_000,
      second === 0
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

  muxer.finalize();

  return new Uint8Array(target.buffer);
}

function framesOf(clip: Uint8Array | null) {
  const track = clip === null ? null : readMp4(clip);

  return (track?.samples ?? []).map((sample) => ({
    atUs: sample.timestampUs,
    isKey: sample.isKey,
    byte: clip?.[sample.offset],
  }));
}

describe('clipOfMp4', () => {
  it('starts at the key frame before the stretch and stops once it is over, from zero', () => {
    expect(
      framesOf(clipOfMp4({ video: recording(12), fromMs: 5_500, toMs: 6_200 })),
    ).toEqual([
      { atUs: 0, isKey: true, byte: 4 },
      { atUs: 1_000_000, isKey: false, byte: 5 },
      { atUs: 2_000_000, isKey: false, byte: 6 },
    ]);
  });

  it('keeps the size and the codec of the recording', () => {
    const track = readMp4(
      clipOfMp4({ video: recording(6), fromMs: 0, toMs: 1_000 }) ?? new Uint8Array(),
    );

    expect(track).toMatchObject({ codec: 'avc1.640028', width: 640, height: 400 });
    expect(track?.description).toEqual(AVCC);
  });

  it('cuts a stretch past the end down to the frames there are', () => {
    expect(
      framesOf(clipOfMp4({ video: recording(6), fromMs: 4_000, toMs: 60_000 })).map(
        ({ byte }) => byte,
      ),
    ).toEqual([4, 5]);
  });

  it('cuts nothing out of a file that is not an MP4', () => {
    expect(
      clipOfMp4({ video: new Uint8Array([1, 2, 3]), fromMs: 0, toMs: 1_000 }),
    ).toBeNull();
  });
});
