import { describe, expect, it } from 'vitest';
import { parseProcessSweep } from '@/main/library';

const SWEEP = [
  '  501     1   21:05.80  12480 /sbin/launchd',
  ' 1234   501   0:12.50 189320 /Applications/QAzinho.app/Contents/MacOS/QAzinho',
  ' 1240  1234   0:04.00  43008 claude --print --model sonnet',
].join('\n');

describe('parseProcessSweep', () => {
  it('reads a row of ps into numbers', () => {
    const [launchd] = parseProcessSweep(SWEEP);

    expect(launchd).toEqual({
      pid: 501,
      parentPid: 1,
      cpuSeconds: 1265.8,
      ramMb: 12480 / 1024,
      name: '/sbin/launchd',
      command: '/sbin/launchd',
    });
  });

  it('turns the resident size into megabytes, because ps answers in kilobytes', () => {
    const rows = parseProcessSweep(SWEEP);

    expect(rows[2]?.ramMb).toBeCloseTo(42);
  });

  it('keeps the flags, because that is where a run says who it belongs to', () => {
    const rows = parseProcessSweep(SWEEP);

    expect(rows[2]?.command).toBe('claude --print --model sonnet');
    expect(rows[2]?.name).toBe('claude');
  });

  it('a program path with spaces stays whole, flags and all', () => {
    const rows = parseProcessSweep(
      '  1  0  0:00.00  1024 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --user-data-dir=/tmp/w1',
    );

    expect(rows[0]?.name).toBe(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    );
  });

  it('a program with no flags is all name', () => {
    const rows = parseProcessSweep(
      '  1  0  0:00.00  1024 /Applications/My App.app/Contents/MacOS/My App',
    );

    expect(rows[0]?.name).toBe('/Applications/My App.app/Contents/MacOS/My App');
  });

  it('ignores the blank lines ps leaves at the end', () => {
    expect(parseProcessSweep('\n\n')).toEqual([]);
  });
});
