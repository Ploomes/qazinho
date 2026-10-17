import { describe, expect, it } from 'vitest';
import { explainFailure } from '@/main/classes/setup/SetupInstaller/library';

const BREW = [
  'Warning: The following taps are not trusted: lightpanda-io/browser oven-sh/bun',
  'Trust whole taps with:',
  'brew trust lightpanda-io/browser oven-sh/bun',
  'For more information, see:',
  'https://docs.brew.sh/Tap-Trust',
  'Error: The following directories are not writable by your user:',
  '/opt/homebrew/lib/python3.14/site-packages',
  'You should change the ownership of these directories to your user,',
  'and make sure that you have write permission.',
  'sudo chown -R qa /opt/homebrew/lib/python3.14/site-packages',
  'chmod u+w /opt/homebrew/lib/python3.14/site-packages',
];

describe('explainFailure', () => {
  it('starts at the error, so a warning printed before it never buries it', () => {
    const { error } = explainFailure(BREW);

    expect(error.split('\n')[0]).toBe(
      'Error: The following directories are not writable by your user:',
    );
    expect(error).not.toContain('Tap-Trust');
  });

  it('offers the fix the command suggested, in the order it gave it', () => {
    expect(explainFailure(BREW).fix).toBe(
      'sudo chown -R qa /opt/homebrew/lib/python3.14/site-packages && chmod u+w /opt/homebrew/lib/python3.14/site-packages',
    );
  });

  it('keeps everything when nothing says it is the error', () => {
    expect(explainFailure(['npm ERR! code EACCES', 'npm ERR! path /usr/lib'])).toEqual({
      error: 'npm ERR! code EACCES\nnpm ERR! path /usr/lib',
      fix: null,
    });
  });

  it('has no fix to offer when the output suggested none', () => {
    expect(explainFailure(['Error: No such formula']).fix).toBeNull();
  });

  it('offers the Command Line Tools when Homebrew asks for them', () => {
    expect(
      explainFailure([
        '==> Installing idb-companion from facebook/fb',
        'Error: Xcode alone is not sufficient on Tahoe.',
        'Install the Command Line Tools:',
        'xcode-select --install',
      ]),
    ).toEqual({
      error:
        'Error: Xcode alone is not sufficient on Tahoe.\nInstall the Command Line Tools:\nxcode-select --install',
      fix: 'xcode-select --install',
    });
  });
});
