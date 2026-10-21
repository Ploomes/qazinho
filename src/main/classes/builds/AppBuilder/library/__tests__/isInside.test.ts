import { describe, expect, it } from 'vitest';
import { isInside } from '@/main/classes/builds/AppBuilder/library';

describe('isInside', () => {
  it('takes a path inside the folder, whole or relative', () => {
    expect(isInside({ dir: '/b/src', path: '/b/src/android/app.apk' })).toBe(true);
    expect(isInside({ dir: '/b/src', path: 'android/app.apk' })).toBe(true);
  });

  it('does NOT take the folder itself, a way out of it, or another folder', () => {
    expect(isInside({ dir: '/b/src', path: '/b/src' })).toBe(false);
    expect(isInside({ dir: '/b/src', path: '../../etc/passwd' })).toBe(false);
    expect(isInside({ dir: '/b/src', path: '/b/srcx/app.apk' })).toBe(false);
    expect(isInside({ dir: '/b/src', path: '/Users/qa/app.apk' })).toBe(false);
  });
});
