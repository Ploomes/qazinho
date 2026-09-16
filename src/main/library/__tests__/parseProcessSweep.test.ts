import { describe, expect, it } from 'vitest';
import { parseProcessSweep } from '@/main/library';

const SWEEP = [
  '  501     1   0.0  12480 /sbin/launchd',
  ' 1234   501  12.5 189320 /Applications/gocrash.app/Contents/MacOS/gocrash',
  ' 1240  1234   4.0  43008 claude',
].join('\n');

describe('parseProcessSweep', () => {
  it('reads a row of ps into numbers', () => {
    const [launchd] = parseProcessSweep(SWEEP);

    expect(launchd).toEqual({
      pid: 501,
      parentPid: 1,
      cpu: 0,
      ramMb: 12480 / 1024,
      name: '/sbin/launchd',
    });
  });

  it('turns the resident size into megabytes, because ps answers in kilobytes', () => {
    const rows = parseProcessSweep(SWEEP);

    expect(rows[2]?.ramMb).toBeCloseTo(42);
  });

  it('keeps a command that holds spaces in one piece', () => {
    const rows = parseProcessSweep(
      '  1  0  0.0  1024 /Applications/My App.app/Contents/MacOS/My App',
    );

    expect(rows[0]?.name).toBe('/Applications/My App.app/Contents/MacOS/My App');
  });

  it('ignores the blank lines ps leaves at the end', () => {
    expect(parseProcessSweep('\n\n')).toEqual([]);
  });
});
