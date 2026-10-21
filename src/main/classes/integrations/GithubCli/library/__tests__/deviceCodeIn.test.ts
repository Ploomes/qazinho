import { describe, expect, it } from 'vitest';
import { deviceCodeIn } from '@/main/classes/integrations/GithubCli/library';

describe('deviceCodeIn', () => {
  it('reads the code and the page gh prints when it is not in a terminal', () => {
    expect(
      deviceCodeIn(
        '\n! First copy your one-time code: AA0B-11E8\nOpen this URL to continue in your web browser: https://github.com/login/device\n',
      ),
    ).toEqual({ code: 'AA0B-11E8', url: 'https://github.com/login/device' });
  });

  it('falls back to the device page while gh has printed only the code', () => {
    expect(deviceCodeIn('! First copy your one-time code: 1c2d-3e4f')).toEqual({
      code: '1C2D-3E4F',
      url: 'https://github.com/login/device',
    });
  });

  it('does NOT find a code before gh printed one', () => {
    expect(
      deviceCodeIn('Open this URL to continue: https://github.com/login/device'),
    ).toBeNull();
    expect(deviceCodeIn('')).toBeNull();
  });
});
