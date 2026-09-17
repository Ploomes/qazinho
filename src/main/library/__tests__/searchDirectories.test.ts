import { describe, expect, it } from 'vitest';
import { searchDirectories } from '@/main/library';

describe('searchDirectories', () => {
  it("looks in the app's PATH first, then the shell's, then where installs land", () => {
    const directories = searchDirectories({
      appPath: '/usr/bin:/bin',
      shellPath: '/Users/qa/.nvm/bin:/usr/bin',
      home: '/Users/qa',
    });

    expect(directories.slice(0, 3)).toEqual(['/usr/bin', '/bin', '/Users/qa/.nvm/bin']);
    expect(directories).toContain('/opt/homebrew/bin');
  });

  it('puts the home-relative install places under the home folder', () => {
    const directories = searchDirectories({
      appPath: undefined,
      shellPath: undefined,
      home: '/Users/qa',
    });

    expect(directories).toContain('/Users/qa/.local/bin');
    expect(directories).toContain('/Users/qa/.claude/local');
  });

  it('never repeats a directory', () => {
    const directories = searchDirectories({
      appPath: '/opt/homebrew/bin',
      shellPath: '/opt/homebrew/bin',
      home: '/Users/qa',
    });

    expect(
      directories.filter((directory) => directory === '/opt/homebrew/bin'),
    ).toHaveLength(1);
  });
});
