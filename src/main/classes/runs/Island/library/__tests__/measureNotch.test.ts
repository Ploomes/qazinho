import { describe, expect, it } from 'vitest';
import { measureNotch } from '@/main/classes/runs/Island/library';

const answering = (stdout: string) => () => Promise.resolve({ stdout });

describe('measureNotch', () => {
  it('reads the notch the way macOS measures it', async () => {
    expect(
      await measureNotch({
        platform: 'darwin',
        run: answering('{"top":37,"width":198.5}\n'),
      }),
    ).toEqual({ width: 198.5, height: 37 });
  });

  it('says there is none on a screen with no notch', async () => {
    expect(
      await measureNotch({
        platform: 'darwin',
        run: answering('{"top":0,"width":1512}'),
      }),
    ).toBeNull();
  });

  it('never asks a system that is not a Mac', async () => {
    let asked = false;

    expect(
      await measureNotch({
        platform: 'win32',
        run: () => {
          asked = true;

          return Promise.resolve({ stdout: '' });
        },
      }),
    ).toBeNull();
    expect(asked).toBe(false);
  });

  it('knows nothing when macOS did not answer, or answered something else', async () => {
    expect(
      await measureNotch({
        platform: 'darwin',
        run: () => Promise.reject(new Error('no')),
      }),
    ).toBe('unknown');
    expect(await measureNotch({ platform: 'darwin', run: answering('nope') })).toBe(
      'unknown',
    );
    expect(await measureNotch({ platform: 'darwin', run: answering('{}') })).toBe(
      'unknown',
    );
  });
});
