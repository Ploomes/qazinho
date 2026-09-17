import type { ISetupEvent } from '@/types';
import { chmod, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SetupInstaller } from '@/main/classes/setup/SetupInstaller';

// Prints the way npm does, with a line redrawn by a carriage return, and fails on demand.
function fakeNpm(exitCode: number) {
  return `#!/bin/sh
printf 'idealTree: timing\\rreify: fetching @anthropic-ai/claude-code\\n'
echo "added 3 packages in 2s" 1>&2
exit ${String(exitCode)}
`;
}

async function installerWith(script: string | null) {
  const bin = await mkdtemp(join(tmpdir(), 'gocrash-setup-'));

  if (script !== null) {
    await writeFile(join(bin, 'npm'), script);
    await chmod(join(bin, 'npm'), 0o755);
  }

  const events: ISetupEvent[] = [];
  const installer = new SetupInstaller({
    onEvent: (event) => events.push(event),
    directories: () => Promise.resolve([bin]),
  });

  return { installer, events };
}

describe('installing a tool', () => {
  it('runs the recipe and streams every line it printed', async () => {
    const { installer, events } = await installerWith(fakeNpm(0));

    expect(await installer.install('claude-code')).toEqual({ isInstalled: true });
    expect(events.map(({ line }) => line)).toEqual([
      '$ npm install -g @anthropic-ai/claude-code',
      'reify: fetching @anthropic-ai/claude-code',
      'added 3 packages in 2s',
    ]);
    expect(events.every(({ stage, stages }) => stage === 1 && stages === 1)).toBe(true);
  });

  it('fails with what the command said, and the line to run by hand', async () => {
    const { installer } = await installerWith(fakeNpm(1));
    const result = await installer.install('claude-code');

    expect(result).toMatchObject({
      isInstalled: false,
      command: 'npm install -g @anthropic-ai/claude-code',
    });
    expect(!result.isInstalled && result.error).toContain('added 3 packages');
  });

  it('says to install Node.js when there is no npm, without running anything', async () => {
    const { installer, events } = await installerWith(null);
    const result = await installer.install('codex');

    expect(!result.isInstalled && result.error).toContain('nodejs.org');
    expect(events).toEqual([]);
  });
});
