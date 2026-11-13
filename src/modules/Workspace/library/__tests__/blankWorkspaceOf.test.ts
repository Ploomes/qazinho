import { describe, expect, it } from 'vitest';
import { blankWorkspaceOf } from '@/modules/Workspace/library';

describe('blankWorkspaceOf', () => {
  it('opens an empty plan in the project, with no app picked yet', () => {
    expect(
      blankWorkspaceOf({ projectId: 'p1', name: 'SHOP-878', now: 42 }),
    ).toMatchObject({
      id: 'w-42',
      projectId: 'p1',
      name: 'SHOP-878',
      targetId: '',
      planKind: 'web',
      plan: [],
      chat: [],
      live: null,
      viewportId: 'desktop',
    });
  });
});
