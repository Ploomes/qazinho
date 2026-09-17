import { describe, expect, it } from 'vitest';
import { lastLineOf } from '@/main/classes/setup/SetupInstaller/library';

const ESCAPE = String.fromCharCode(27);

describe('lastLineOf', () => {
  it('keeps the last line a command printed', () => {
    expect(lastLineOf('==> Fetching idb-companion\n==> Pouring idb-companion\n')).toBe(
      '==> Pouring idb-companion',
    );
  });

  it('reads a line npm redrew with a carriage return as the newest one', () => {
    expect(lastLineOf('⸩ idealTree: timing\r⸨ reify: fetching\r')).toBe(
      '⸨ reify: fetching',
    );
  });

  it('takes the colours out, so the screen never shows escape codes', () => {
    expect(lastLineOf(`${ESCAPE}[32m==>${ESCAPE}[0m Done`)).toBe('==> Done');
  });

  it('has nothing to say for a chunk of blank lines', () => {
    expect(lastLineOf('\n  \n')).toBe('');
  });
});
