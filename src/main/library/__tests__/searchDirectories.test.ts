import { describe, expect, it } from 'vitest';
import { searchDirectories } from '@/main/library';

const onMac = (props: { appPath?: string; shellPath?: string }) =>
  searchDirectories({
    appPath: props.appPath,
    shellPath: props.shellPath,
    home: '/Users/qa',
    platform: 'darwin',
    env: {},
  });

describe('searchDirectories', () => {
  it("looks in the app's PATH first, then the shell's, then where installs land", () => {
    const directories = onMac({
      appPath: '/usr/bin:/bin',
      shellPath: '/Users/qa/.nvm/bin:/usr/bin',
    });

    expect(directories.slice(0, 3)).toEqual(['/usr/bin', '/bin', '/Users/qa/.nvm/bin']);
    expect(directories).toContain('/opt/homebrew/bin');
  });

  it('puts the home-relative install places under the home folder', () => {
    const directories = onMac({});

    expect(directories).toContain('/Users/qa/.local/bin');
    expect(directories).toContain('/Users/qa/.claude/local');
  });

  it('never repeats a directory', () => {
    const directories = onMac({
      appPath: '/opt/homebrew/bin',
      shellPath: '/opt/homebrew/bin',
    });

    expect(
      directories.filter((directory) => directory === '/opt/homebrew/bin'),
    ).toHaveLength(1);
  });

  it('looks where npm, the native installer, winget, Node, Git and gh land on Windows', () => {
    const directories = searchDirectories({
      appPath: 'C:\\Windows\\System32',
      shellPath: undefined,
      home: 'C:\\Users\\Ana',
      platform: 'win32',
      env: {
        APPDATA: 'C:\\Users\\Ana\\AppData\\Roaming',
        LOCALAPPDATA: 'C:\\Users\\Ana\\AppData\\Local',
        ProgramFiles: 'C:\\Program Files',
      },
    });

    expect(directories).toEqual(
      expect.arrayContaining([
        'C:\\Users\\Ana\\AppData\\Roaming\\npm',
        'C:\\Users\\Ana\\.local\\bin',
        'C:\\Users\\Ana\\AppData\\Local\\Microsoft\\WinGet\\Links',
        'C:\\Program Files\\nodejs',
        'C:\\Program Files\\Git\\cmd',
        'C:\\Program Files\\GitHub CLI',
      ]),
    );
    expect(directories).not.toContain('/opt/homebrew/bin');
    expect(
      directories.filter((one) => one.toLowerCase().endsWith('system32')),
    ).toHaveLength(1);
  });
});
