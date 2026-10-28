import { describe, expect, it } from 'vitest';
import {
  joinBytes,
  takeMjpegPart,
} from '@/services/Recorder/classes/video/FrameRecorder/library';

const JPEG = new Uint8Array([0xff, 0xd8, 0x0d, 0x0a, 0x0d, 0x0a, 0xff, 0xd9]);

function part(props: { at?: string; ratio?: string; length?: string }): Uint8Array {
  const head = [
    '--qazinho-frame',
    'Content-Type: image/jpeg',
    `Content-Length: ${props.length ?? String(JPEG.length)}`,
    ...(props.at === undefined ? [] : [`X-Captured-At: ${props.at}`]),
    ...(props.ratio === undefined ? [] : [`X-Screen-Ratio: ${props.ratio}`]),
    '',
    '',
  ].join('\r\n');

  return joinBytes(
    joinBytes(new TextEncoder().encode(head), JPEG),
    new TextEncoder().encode('\r\n'),
  );
}

describe('takeMjpegPart', () => {
  it('takes a frame with when it was captured and its screen shape, and leaves the rest', () => {
    const taken = takeMjpegPart(part({ at: '1760000000123', ratio: '0.4621' }));

    expect(taken?.part).toEqual({ jpeg: JPEG, at: 1_760_000_000_123, ratio: 0.4621 });
    expect([...(taken?.rest ?? [])]).toEqual([13, 10]);
  });

  /**
   * Um JPEG pode conter os próprios bytes que terminam um cabeçalho; o tamanho, não uma
   * busca, diz onde ele para.
   */
  it('reads a body that carries a blank line inside it by its length', () => {
    expect(takeMjpegPart(part({ at: '1', ratio: '1' }))?.part?.jpeg).toEqual(JPEG);
  });

  it('waits for the rest of a part split across two chunks of the stream', () => {
    const whole = part({ at: '1', ratio: '1' });

    expect(takeMjpegPart(whole.subarray(0, 20))).toBeNull();
    expect(takeMjpegPart(whole.subarray(0, whole.length - 4))).toBeNull();
  });

  it('takes the next frame off what the first one left', () => {
    const both = joinBytes(part({ at: '1', ratio: '1' }), part({ at: '2', ratio: '1' }));
    const first = takeMjpegPart(both);

    expect(takeMjpegPart(first?.rest ?? new Uint8Array())?.part?.at).toBe(2);
  });

  it('skips a block with no length it can read, and a frame that never said when', () => {
    expect(takeMjpegPart(part({ length: 'many', at: '1' }))?.part).toBeNull();
    expect(takeMjpegPart(part({ ratio: '1' }))?.part).toBeNull();
  });

  it('keeps a frame whose screen shape is missing, to be shown whole', () => {
    expect(takeMjpegPart(part({ at: '5' }))?.part?.ratio).toBe(0);
  });
});
