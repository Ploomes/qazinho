import { describe, expect, it } from 'vitest';
import { envKeysOf } from '@/main/classes/automation/SuiteRegistry/library';

describe('envKeysOf', () => {
  it('names each setting in the order the file lists them, never a value', () => {
    expect(envKeysOf('BASE_URL=https://dev.test\nUSER_KEY=abc123\n')).toEqual([
      'BASE_URL',
      'USER_KEY',
    ]);
  });

  it('leaves out comments, blank lines and settings left as comments', () => {
    expect(
      envKeysOf('# How to log in\n\nPROJECT_ID=\n# E2E_OPTIONAL=1\n  # INDENTED=2\n'),
    ).toEqual(['PROJECT_ID']);
  });

  it('reads an exported setting, spaces around the sign and Windows line ends', () => {
    expect(envKeysOf('export TOKEN = x\r\nCHANNEL=chrome\r\n')).toEqual([
      'TOKEN',
      'CHANNEL',
    ]);
  });

  it('names a setting once though the file repeats it', () => {
    expect(envKeysOf('A=1\nA=2\n')).toEqual(['A']);
  });
});
