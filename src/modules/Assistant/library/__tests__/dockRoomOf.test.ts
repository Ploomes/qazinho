import { describe, expect, it } from 'vitest';
import { dockRoomOf } from '@/modules/Assistant/library';

describe('dockRoomOf', () => {
  it('opens room for the chat composer when the agent panel holds the corner', () => {
    expect(dockRoomOf({ isWorkspace: true, isPanelOpen: true })).toBe(88);
  });

  it('takes no room with the agent collapsed, or off a workspace', () => {
    expect(dockRoomOf({ isWorkspace: true, isPanelOpen: false })).toBe(0);
    expect(dockRoomOf({ isWorkspace: false, isPanelOpen: true })).toBe(0);
  });
});
