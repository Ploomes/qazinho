import { describe, expect, it } from 'vitest';
import { canUpdateOf } from '@/main/classes/setup/AppUpdater/library';

const can = (change: Partial<Parameters<typeof canUpdateOf>[0]>) =>
  canUpdateOf({
    platform: 'darwin',
    isPackaged: true,
    hasFeed: false,
    appImage: undefined,
    ...change,
  });

describe('canUpdateOf', () => {
  it('updates an installed app on a Mac and on Windows', () => {
    expect(can({ platform: 'darwin' })).toBe(true);
    expect(can({ platform: 'win32' })).toBe(true);
  });

  it('updates on Linux only from an AppImage', () => {
    expect(can({ platform: 'linux' })).toBe(false);
    expect(can({ platform: 'linux', appImage: '/home/ana/QAzinho.AppImage' })).toBe(true);
  });

  it('does NOT update while running from the code', () => {
    expect(can({ isPackaged: false })).toBe(false);
  });

  it('follows a feed it was pointed at, even from the code', () => {
    expect(can({ isPackaged: false, hasFeed: true })).toBe(true);
    expect(can({ platform: 'linux', hasFeed: true })).toBe(true);
  });
});
