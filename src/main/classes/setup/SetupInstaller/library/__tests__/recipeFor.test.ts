import { describe, expect, it } from 'vitest';
import { INSTALL } from '@/main/classes/setup/SetupInstaller/constants';
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

  it('downloads the AXe release and links its binary where the detector looks', () => {
    expect(lines('axe')).toEqual([
      'mkdir -p /Users/qa/.local/share/qazinho/axe',
      `curl -fsSL -o /Users/qa/.local/share/qazinho/axe/axe.tar.gz ${INSTALL.axeUrl}`,
      'tar xzf /Users/qa/.local/share/qazinho/axe/axe.tar.gz -C /Users/qa/.local/share/qazinho/axe',
      'mkdir -p /Users/qa/.local/bin',
      'ln -sf /Users/qa/.local/share/qazinho/axe/axe /Users/qa/.local/bin/axe',
    ]);
  });

  it('never installs AXe through Homebrew or Python, because the release is a plain binary', () => {
    expect(lines('axe').some((line) => /brew|pip|python|pipx/.test(line))).toBe(false);
  });
});
