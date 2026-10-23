import { describe, expect, it } from 'vitest';
import { linesOf } from '@/main/classes/setup/SetupInstaller/library';

const ESCAPE = String.fromCharCode(27);

describe('linesOf', () => {
  it('keeps every line, so a failure carries the whole explanation and not just its last line', () => {
    expect(
      linesOf(
        'Error: The following directories are not writable by your user:\n  /opt/homebrew/lib/python3.14/site-packages\n\n  sudo chown -R qa /opt/homebrew/lib/python3.14/site-packages\n',
      ),
    ).toEqual([
      'Error: The following directories are not writable by your user:',
      '/opt/homebrew/lib/python3.14/site-packages',
      'sudo chown -R qa /opt/homebrew/lib/python3.14/site-packages',
    ]);
  });

  it('reads a line npm redrew with a carriage return as its newest state only', () => {
    expect(linesOf('idealTree: timing\rreify: fetching\nadded 3 packages\n')).toEqual([
      'reify: fetching',
      'added 3 packages',
    ]);
  });

  it('takes the colours out, so the screen never shows escape codes', () => {
    expect(linesOf(`${ESCAPE}[32m==>${ESCAPE}[0m Done`)).toEqual(['==> Done']);
  });

  it('has nothing for a chunk of blank lines', () => {
    expect(linesOf('\n  \n')).toEqual([]);
  });

  /** winget and cmd end their lines with a carriage return and a line feed; the line is not a redraw. */
  it('keeps every line a Windows tool printed', () => {
    expect(linesOf('Found GitHub CLI\r\nSuccessfully installed\r\n')).toEqual([
      'Found GitHub CLI',
      'Successfully installed',
    ]);
  });
});
