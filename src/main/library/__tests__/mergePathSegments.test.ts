import { describe, expect, it } from 'vitest';
import { mergePathSegments } from '@/main/library';

const posixOf = (segments: (string | undefined)[]) =>
  mergePathSegments({ segments, platform: 'darwin' });

describe('mergePathSegments', () => {
  it('splits a PATH into its directories', () => {
    expect(posixOf(['/usr/bin:/bin'])).toEqual(['/usr/bin', '/bin']);
  });

  it('keeps the first mention, because the hydrated PATH repeats what the app had', () => {
    expect(posixOf(['/usr/bin:/bin', '/opt/homebrew/bin:/usr/bin'])).toEqual([
      '/usr/bin',
      '/bin',
      '/opt/homebrew/bin',
    ]);
  });

  it('survives a shell that answered nothing', () => {
    expect(posixOf([undefined, '', '/usr/bin'])).toEqual(['/usr/bin']);
  });

  it('drops the empty entry a trailing colon leaves behind', () => {
    expect(posixOf(['/usr/bin::/bin:'])).toEqual(['/usr/bin', '/bin']);
  });

  /**
   * Uma divisão por dois-pontos cortava `C:\Windows` em `C` e `\Windows`, e nada era
   * achado no Windows.
   */
  it('splits a Windows PATH by semicolons, keeping the drive letters whole', () => {
    expect(
      mergePathSegments({
        segments: [
          'C:\\Windows\\System32;"C:\\Program Files\\nodejs";;C:\\windows\\system32',
        ],
        platform: 'win32',
      }),
    ).toEqual(['C:\\Windows\\System32', 'C:\\Program Files\\nodejs']);
  });
});
