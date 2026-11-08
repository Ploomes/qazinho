import { describe, expect, it } from 'vitest';
import { streamKeyOf } from '@/main/classes/devices/LiveStream/library/streamKeyOf';

describe('streamKeyOf', () => {
  it('is the workspace itself for the screen the agent is on', () => {
    expect(streamKeyOf({ workspaceId: 'w-1' })).toBe('w-1');
  });

  it('keeps each open screen apart', () => {
    expect(streamKeyOf({ workspaceId: 'w-1', screen: 2 })).toBe('w-1~2');
  });
});
