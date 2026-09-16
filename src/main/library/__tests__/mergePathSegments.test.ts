import { describe, expect, it } from 'vitest';
import { mergePathSegments } from '@/main/library';

describe('mergePathSegments', () => {
  it('splits a PATH into its directories', () => {
    expect(mergePathSegments(['/usr/bin:/bin'])).toEqual(['/usr/bin', '/bin']);
  });

  it('keeps the first mention, because the hydrated PATH repeats what the app had', () => {
    expect(mergePathSegments(['/usr/bin:/bin', '/opt/homebrew/bin:/usr/bin'])).toEqual([
      '/usr/bin',
      '/bin',
      '/opt/homebrew/bin',
    ]);
  });

  it('survives a shell that answered nothing', () => {
    expect(mergePathSegments([undefined, '', '/usr/bin'])).toEqual(['/usr/bin']);
  });

  it('drops the empty entry a trailing colon leaves behind', () => {
    expect(mergePathSegments(['/usr/bin::/bin:'])).toEqual(['/usr/bin', '/bin']);
  });
});
