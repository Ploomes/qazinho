import { describe, expect, it } from 'vitest';
import { commandLineOf } from '@/main/classes/setup/SetupInstaller/library';

describe('commandLineOf', () => {
  it('joins the steps into one line a terminal runs in order', () => {
    expect(
      commandLineOf([
        { command: 'mkdir', args: ['-p', '/tmp/axe'] },
        { command: 'tar', args: ['xzf', 'axe.tar.gz', '-C', '/tmp/axe'] },
      ]),
    ).toBe('mkdir -p /tmp/axe && tar xzf axe.tar.gz -C /tmp/axe');
  });

  it('writes a single step without a separator', () => {
    expect(commandLineOf([{ command: 'npm', args: ['install', '-g', 'x'] }])).toBe(
      'npm install -g x',
    );
  });
});
