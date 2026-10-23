import { describe, expect, it } from 'vitest';
import { recipeFor } from '@/main/classes/setup/SetupInstaller/library';

const HOME = '/Users/qa';

function lines(item: Parameters<typeof recipeFor>[0]['item']) {
  return recipeFor({ item, home: HOME, platform: 'darwin' }).map((step) =>
    [step.command, ...step.args].join(' '),
  );
}

describe('recipeFor', () => {
  it('installs every agent globally with npm, in one command', () => {
    expect(lines('claude-code')).toEqual(['npm install -g @anthropic-ai/claude-code']);
    expect(lines('codex')).toEqual(['npm install -g @openai/codex']);
  });

  it('installs the GitHub CLI with Homebrew, and skips it when Homebrew already has it', () => {
    expect(recipeFor({ item: 'gh', home: HOME, platform: 'darwin' })).toEqual([
      {
        command: 'brew',
        args: ['install', 'gh'],
        doneIf: { command: 'brew', args: ['list', '--versions', 'gh'] },
      },
    ]);
  });

  it('installs the GitHub CLI with winget on Windows, and skips it when winget lists it', () => {
    expect(
      recipeFor({ item: 'gh', home: 'C:\\Users\\qa', platform: 'win32' }).map(
        ({ command, args, doneIf }) => [command, args[0], args[2], doneIf?.args[0]],
      ),
    ).toEqual([['winget', 'install', 'GitHub.cli', 'list']]);
  });

  it('installs the idb companion before the client that talks to it', () => {
    const idb = lines('idb');

    expect(idb.indexOf('brew install facebook/fb/idb-companion')).toBeLessThan(
      idb.indexOf('/Users/qa/.local/share/qazinho/idb/bin/pip install --upgrade fb-idb'),
    );
  });

  it("gives idb's client a Python of its own and links it where the detector looks", () => {
    expect(lines('idb').slice(2)).toEqual([
      'python3 -m venv /Users/qa/.local/share/qazinho/idb',
      '/Users/qa/.local/share/qazinho/idb/bin/pip install --upgrade fb-idb',
      'mkdir -p /Users/qa/.local/bin',
      'ln -sf /Users/qa/.local/share/qazinho/idb/bin/idb /Users/qa/.local/bin/idb',
    ]);
  });

  it('never installs pipx or another Python through Homebrew', () => {
    expect(lines('idb').some((line) => /pipx|install python/.test(line))).toBe(false);
  });

  it('knows when each heavy step is already done, so a second run skips it', () => {
    const [tap, companion, venv, client] = recipeFor({
      item: 'idb',
      home: HOME,
      platform: 'darwin',
    });

    expect(tap?.doneIf).toEqual({
      command: 'brew',
      args: ['list', '--versions', 'idb-companion'],
    });
    expect(companion?.doneIf).toEqual(tap?.doneIf);
    expect(venv?.doneIf?.args).toEqual([
      '-x',
      '/Users/qa/.local/share/qazinho/idb/bin/python',
    ]);
    expect(client?.doneIf?.args).toEqual([
      '-x',
      '/Users/qa/.local/share/qazinho/idb/bin/idb',
    ]);
  });
});
