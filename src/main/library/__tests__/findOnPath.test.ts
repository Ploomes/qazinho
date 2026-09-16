import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findOnPath } from '@/main/library';

function directoryWith(props: { command: string; isExecutable: boolean }): string {
  const directory = mkdtempSync(join(tmpdir(), 'gocrash-path-'));
  const file = join(directory, props.command);

  writeFileSync(file, '#!/bin/sh\n');
  chmodSync(file, props.isExecutable ? 0o755 : 0o644);

  return directory;
}

describe('findOnPath', () => {
  it('answers with the binary it found', () => {
    const directory = directoryWith({ command: 'claude', isExecutable: true });

    expect(findOnPath({ command: 'claude', directories: [directory] })).toBe(
      join(directory, 'claude'),
    );
  });

  it('takes the first directory that has it, the way a shell would', () => {
    const first = directoryWith({ command: 'claude', isExecutable: true });
    const second = directoryWith({ command: 'claude', isExecutable: true });

    expect(findOnPath({ command: 'claude', directories: [first, second] })).toBe(
      join(first, 'claude'),
    );
  });

  it('does NOT accept a file that cannot be executed', () => {
    const directory = directoryWith({ command: 'claude', isExecutable: false });

    expect(findOnPath({ command: 'claude', directories: [directory] })).toBeNull();
  });

  it('answers null for an agent this machine does not have', () => {
    const directory = directoryWith({ command: 'claude', isExecutable: true });

    expect(findOnPath({ command: 'codex', directories: [directory] })).toBeNull();
  });

  it('walks past a directory that does not exist', () => {
    const directory = directoryWith({ command: 'claude', isExecutable: true });

    expect(findOnPath({ command: 'claude', directories: ['/nope', directory] })).toBe(
      join(directory, 'claude'),
    );
  });
});
