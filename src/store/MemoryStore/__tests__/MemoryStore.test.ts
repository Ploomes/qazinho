import { beforeEach, describe, expect, it } from 'vitest';
import { useMemoryStore } from '@/store/MemoryStore';

const said = (text: string) => ({ kind: 'said' as const, text });

describe('useMemoryStore', () => {
  beforeEach(() => {
    useMemoryStore.setState({ waiting: [], isKeeping: false });
  });

  it('takes nothing when nothing waits', () => {
    expect(useMemoryStore.getState().take()).toBeNull();
    expect(useMemoryStore.getState().isKeeping).toBe(false);
  });

  it('takes everything a workspace has waiting as one, so it is weighed once', () => {
    const { enqueue, take } = useMemoryStore.getState();

    enqueue({ projectId: 'p', workspaceId: 'w-1', events: [said('a')] });
    enqueue({ projectId: 'p', workspaceId: 'w-1', events: [said('b')] });

    expect(take()?.events).toEqual([said('a'), said('b')]);
    expect(useMemoryStore.getState().waiting).toEqual([]);
    expect(useMemoryStore.getState().isKeeping).toBe(true);
  });

  it('leaves the other workspaces waiting their turn', () => {
    const { enqueue, take } = useMemoryStore.getState();

    enqueue({ projectId: 'p', workspaceId: 'w-1', events: [said('a')] });
    enqueue({ projectId: 'p', workspaceId: 'w-2', events: [said('b')] });

    expect(take()?.workspaceId).toBe('w-1');
    expect(useMemoryStore.getState().waiting).toHaveLength(1);
  });

  it('lets the next one go when the keeper finished', () => {
    useMemoryStore.setState({ isKeeping: true });
    useMemoryStore.getState().finish();

    expect(useMemoryStore.getState().isKeeping).toBe(false);
  });
});
