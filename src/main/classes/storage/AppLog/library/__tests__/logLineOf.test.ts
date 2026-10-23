import { describe, expect, it } from 'vitest';
import { logLineOf } from '@/main/classes/storage/AppLog/library';

const AT = new Date('2026-10-24T03:00:00.000Z');
const line = (message: string, home = '/Users/ana') =>
  logLineOf({ at: AT, level: 'error', scope: 'main', message, home });

describe('logLineOf', () => {
  it('writes when, how much it matters, where and what, on one line', () => {
    expect(line('Agent exited with code 1\n  at run (index.js:10)')).toBe(
      '2026-10-24T03:00:00.000Z ERROR [main] Agent exited with code 1 ⏎ at run (index.js:10)\n',
    );
  });

  it('writes the home folder as ~, so the user name stays out', () => {
    expect(line('Cannot read /Users/ana/Library/agent/settings.json')).toContain(
      'Cannot read ~/Library/agent/settings.json',
    );
    expect(line('C:\\Users\\Ana\\AppData\\x', 'C:\\Users\\Ana')).toContain(
      '~\\AppData\\x',
    );
  });

  it('puts dots where a token or a password would be', () => {
    const written = line(
      'sent ATATT3xFfGF0abcdefghijklmnop and ghp_abcdefghijklmnopqrstuvwxyz12 with Authorization: Bearer abc.def.ghijklmnop and password=Hunter2! and {"token":"s3cr3t"}',
    );

    expect(written).not.toMatch(/ATATT3x|ghp_abc|abc\.def|Hunter2|s3cr3t/);
    expect(written).toContain('Bearer •••');
    expect(written).toContain('password=•••');
    expect(written).toContain('"token":"•••');
  });

  it('cuts a line too long to read', () => {
    expect(line('a'.repeat(5_000)).length).toBeLessThan(2_100);
  });
});
