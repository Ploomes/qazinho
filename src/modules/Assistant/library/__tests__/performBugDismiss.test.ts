import { describe, expect, it } from 'vitest';
import { performBugDismiss } from '@/modules/Assistant/library';
import { CHECKOUT, fakePort } from './fixtures';

const dismiss = (args: { bug: string; reopen?: boolean }) => ({
  name: 'dismiss_bug' as const,
  args: { workspace: 'Checkout regression', ...args },
});

describe('performBugDismiss', () => {
  it("takes the QA's word that a bug is none", () => {
    const { port, did } = fakePort();

    expect(performBugDismiss({ call: dismiss({ bug: 'bug-01' }), port })).toMatchObject({
      text: expect.stringContaining('BUG-01'),
      isError: false,
    });
    expect(did).toEqual(['dismiss BUG-01']);
  });

  it('opens a dismissed bug again, and does nothing to one already as asked', () => {
    const { port, did } = fakePort({
      state: {
        workspaces: [
          {
            ...CHECKOUT,
            bugs: CHECKOUT.bugs.map((bug) => ({ ...bug, isDismissed: true })),
          },
        ],
      },
    });

    expect(performBugDismiss({ call: dismiss({ bug: 'BUG-01' }), port }).text).toBe(
      'BUG-01 was already marked as no bug.',
    );
    expect(
      performBugDismiss({ call: dismiss({ bug: 'BUG-01', reopen: true }), port }).text,
    ).toContain('is an open bug again');
    expect(did).toEqual(['reopen BUG-01']);
  });

  it('does NOT touch a bug the workspace does not have, and names the ones it has', () => {
    const { port, did } = fakePort();

    expect(performBugDismiss({ call: dismiss({ bug: 'BUG-09' }), port })).toEqual({
      text: 'w1 has no bug "BUG-09". Its bugs are BUG-01.',
      isError: true,
    });
    expect(did).toEqual([]);
  });
});
