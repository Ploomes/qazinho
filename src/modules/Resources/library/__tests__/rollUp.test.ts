import { describe, expect, it } from 'vitest';
import { rollUp } from '@/modules/Resources/library';
import { sample } from './fixtures';

describe('rollUp', () => {
  it('adds a dozen browser processes into one line', () => {
    const rolled = rollUp([
      sample({ name: 'Google Chrome', kind: 'device', ramMb: 1024 }),
      sample({ name: 'Google Chrome Helper', kind: 'device', ramMb: 512 }),
    ]);

    expect(rolled).toEqual({ name: 'Google Chrome', cpu: 8, ramGb: 1.5 });
  });

  it('nothing running costs nothing, and is not a crash', () => {
    expect(rollUp([])).toEqual({ name: '', cpu: 0, ramGb: 0 });
  });
});
