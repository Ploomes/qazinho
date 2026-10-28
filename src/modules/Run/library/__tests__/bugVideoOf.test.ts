import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import { describe, expect, it } from 'vitest';
import { bugVideoOf } from '@/modules/Run/library';
import { recordedRun, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

/** Uma gravação de doze segundos, um frame por segundo e um key frame a cada quatro. */
function recording(): Uint8Array {
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width: 1280, height: 800 },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });

  for (let second = 0; second < 12; second += 1)
    muxer.addVideoChunkRaw(
      new Uint8Array([second]),
      second % 4 === 0 ? 'key' : 'delta',
      second * 1_000_000,
      1_000_000,
      second === 0
        ? {
            decoderConfig: {
              codec: 'avc1.640028',
              codedWidth: 1280,
              codedHeight: 800,
              description: new Uint8Array([1, 0x64, 0x00, 0x28, 0xff, 0xe0, 0x00]),
            },
          }
        : undefined,
    );

  muxer.finalize();

  return new Uint8Array(target.buffer);
}

const WORKSPACE = recordedRun();
const RUN = WORKSPACE.runs[0]!;
const BUG = WORKSPACE.bugs[0]!;
const NAMES = { clipName: 'BUG-01 clip', recordingName: 'BUG-01 r-01 recording' };

describe('bugVideoOf', () => {
  it('cuts a clip of the bug’s moment out of the run’s MP4, and says where the bug sits', () => {
    const made = bugVideoOf({
      workspaceId: 'w1',
      run: RUN,
      bug: BUG,
      recording: recording(),
      ...NAMES,
    });

    expect(made?.video).toMatchObject({ kind: 'clip', name: 'BUG-01 clip' });
    expect(made?.atMs).toBe(9_500);
  });

  it('hands the whole recording over when the run kept no MP4 to cut', () => {
    expect(
      bugVideoOf({ workspaceId: 'w1', run: RUN, bug: BUG, recording: null, ...NAMES })
        ?.video,
    ).toEqual({
      kind: 'recording',
      name: 'BUG-01 r-01 recording',
      run: { workspaceId: 'w1', runId: 'r-01' },
    });
  });

  it('has no video for a run with no recording', () => {
    const plain = walkRun({ verdicts: ['passed', 'failed'], isFinished: true });

    expect(
      bugVideoOf({
        workspaceId: 'w1',
        run: plain.runs[0]!,
        bug: plain.bugs[0]!,
        recording: null,
        ...NAMES,
      }),
    ).toBeNull();
  });
});
