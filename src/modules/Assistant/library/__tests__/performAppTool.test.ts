import { describe, expect, it } from 'vitest';
import { performAppTool } from '@/modules/Assistant/library';
import { fakePort } from './fixtures';

describe('performAppTool', () => {
  it('hands each call to the family of tools that carries it out', async () => {
    const { port, did } = fakePort();

    await performAppTool({ id: 'c-1', call: { name: 'go_home', args: {} }, port });
    await performAppTool({
      id: 'c-2',
      call: { name: 'rename_workspace', args: { workspace: 'w2', name: 'Pix' } },
      port,
    });
    await performAppTool({
      id: 'c-3',
      call: { name: 'change_settings', args: { theme: 'night' } },
      port,
    });
    await performAppTool({
      id: 'c-4',
      call: { name: 'delete_workspace', args: { workspace: 'w2' } },
      port,
    });

    expect(did).toEqual([
      'home',
      'rename w2 Pix',
      'change {"theme":"dark"}',
      'confirm delete_workspace Pix 0',
      'remove workspace w2',
    ]);
  });

  it('reads without changing anything', async () => {
    const { port, did } = fakePort();

    expect(
      (
        await performAppTool({
          id: 'c-1',
          call: { name: 'bug_details', args: { workspace: 'w1', bug: 'BUG-01' } },
          port,
        })
      ).isError,
    ).toBe(false);
    expect(did).toEqual([]);
  });
});
