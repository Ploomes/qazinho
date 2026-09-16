// @vitest-environment jsdom
import { Platform } from '@/services/Platform';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => {
  Reflect.deleteProperty(window, 'gocrash');
});

describe('Platform', () => {
  it('reads the platform the preload published', () => {
    window.gocrash = { platform: 'win32' };

    expect(Platform.current()).toBe('win32');
    expect(Platform.isMac()).toBe(false);
  });

  it('knows a Mac, because iOS targets and the traffic lights depend on it', () => {
    window.gocrash = { platform: 'darwin' };

    expect(Platform.isMac()).toBe(true);
  });

  it('answers null outside the app, where there is no bridge at all', () => {
    expect(Platform.current()).toBeNull();
    expect(Platform.isMac()).toBe(false);
  });
});
