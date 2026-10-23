import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { linuxTerminalOf } from '@/main/library';

function binWith(names: string[]): string {
  const directory = mkdtempSync(join(tmpdir(), 'qazinho-terminals-'));

  for (const name of names) {
    writeFileSync(join(directory, name), '#!/bin/sh\n');
    chmodSync(join(directory, name), 0o755);
  }

  return directory;
}

describe('linuxTerminalOf', () => {
  it("takes the desktop's own terminal first", () => {
    const bin = binWith(['xterm', 'x-terminal-emulator']);

    expect(linuxTerminalOf({ directories: [bin], file: '/tmp/sign-in.sh' })).toEqual({
      command: join(bin, 'x-terminal-emulator'),
      args: ['-e', '/bin/sh', '/tmp/sign-in.sh'],
    });
  });

  it("runs the script after GNOME Terminal's own double dash", () => {
    const bin = binWith(['gnome-terminal']);

    expect(linuxTerminalOf({ directories: [bin], file: '/tmp/s.sh' })?.args).toEqual([
      '--',
      '/bin/sh',
      '/tmp/s.sh',
    ]);
  });

  it('answers null on a machine with no terminal', () => {
    expect(linuxTerminalOf({ directories: [binWith([])], file: '/tmp/s.sh' })).toBeNull();
  });
});
