import { describe, expect, it } from 'vitest';
import { commandLineOf } from '@/main/classes/setup/SetupInstaller/library';

describe('commandLineOf', () => {
  it('joins the steps into one line a terminal runs in order', () => {
    expect(
      commandLineOf([
        { command: 'brew', args: ['tap', 'facebook/fb'] },
        { command: 'pipx', args: ['install', 'fb-idb'] },
      ]),
    ).toBe('brew tap facebook/fb && pipx install fb-idb');
  });

  it('writes a single step without a separator', () => {
    expect(commandLineOf([{ command: 'npm', args: ['install', '-g', 'x'] }])).toBe(
      'npm install -g x',
    );
  });
});
