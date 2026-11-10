import { describe, expect, it } from 'vitest';
import { performOpening } from '@/modules/Assistant/library';
import { fakePort } from './fixtures';

describe('performOpening', () => {
  it('opens a workspace on the tab asked, on its chat by default', () => {
    const { port, did } = fakePort();

    expect(
      performOpening({
        call: { name: 'open_workspace', args: { workspace: 'w2' } },
        port,
      }),
    ).toEqual({ text: 'w2 "Login" is on screen, on its chat tab.', isError: false });
    performOpening({
      call: { name: 'open_workspace', args: { workspace: 'w1', tab: 'plan' } },
      port,
    });

    expect(did).toEqual(['open w2 chat - -', 'open w1 plan - -']);
  });

  it('opens a run on runs and a bug on bugs, whatever tab was asked', () => {
    const { port, did } = fakePort();

    performOpening({
      call: {
        name: 'open_workspace',
        args: { workspace: 'w1', tab: 'chat', run: 'R-01' },
      },
      port,
    });
    expect(
      performOpening({
        call: { name: 'open_workspace', args: { workspace: 'w1', bug: 'bug-01' } },
        port,
      }).text,
    ).toBe('w1 "Checkout regression" is on screen, on its bugs tab, with bug BUG-01.');

    expect(did).toEqual(['open w1 runs r-01 -', 'open w1 bugs - BUG-01']);
  });

  it('does NOT open a run or a bug the workspace does not have', () => {
    const { port, did } = fakePort();

    expect(
      performOpening({
        call: { name: 'open_workspace', args: { workspace: 'w2', run: 'r-03' } },
        port,
      }),
    ).toEqual({ text: 'w2 has no run "r-03". Its runs are none yet.', isError: true });
    expect(did).toEqual([]);
  });

  it("opens a project's settings, QAzinho's settings on a section, and home", () => {
    const { port, did } = fakePort();

    performOpening({
      call: { name: 'open_project', args: { project: 'Lojinha' } },
      port,
    });
    expect(
      performOpening({
        call: { name: 'open_settings', args: { section: 'connections' } },
        port,
      }).text,
    ).toBe("QAzinho's settings are on screen, on Connections.");
    performOpening({ call: { name: 'open_settings', args: {} }, port });
    performOpening({ call: { name: 'go_home', args: {} }, port });

    expect(did).toEqual(['project p1', 'settings connections', 'settings -', 'home']);
  });

  it('does NOT open a project that is not there', () => {
    const { port, did } = fakePort();

    expect(
      performOpening({ call: { name: 'open_project', args: { project: 'Banco' } }, port })
        .isError,
    ).toBe(true);
    expect(did).toEqual([]);
  });
});
