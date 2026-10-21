import { describe, expect, it } from 'vitest';
import { dockRoomOf } from '@/modules/Assistant/library';

describe('dockRoomOf', () => {
  it('reaches past the shut device rail by its inset, its size and a gap', () => {
    expect(dockRoomOf({ isWorkspace: true, isDeviceOpen: false })).toBe(42);
  });

  it('takes no room when the open device panel holds the corner, or off a workspace', () => {
    expect(dockRoomOf({ isWorkspace: true, isDeviceOpen: true })).toBe(0);
    expect(dockRoomOf({ isWorkspace: false, isDeviceOpen: false })).toBe(0);
  });
});
