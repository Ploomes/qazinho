import { describe, expect, it } from 'vitest';
import { subjectOf } from '@/modules/Assistant/library';
import { fakePort } from './fixtures';

const { state } = fakePort();

describe('subjectOf', () => {
  it('names a workspace or project by its name, though the agent gave its id', () => {
    expect(
      subjectOf({ call: { name: 'run_plan', args: { workspace: 'w1' } }, state }),
    ).toBe('Checkout regression');
    expect(
      subjectOf({ call: { name: 'open_project', args: { project: 'p1' } }, state }),
    ).toBe('Lojinha');
  });

  it('keeps what the agent wrote when it names nothing QAzinho has', () => {
    expect(
      subjectOf({ call: { name: 'open_workspace', args: { workspace: 'Cart' } }, state }),
    ).toBe('Cart');
  });

  it('names the run, the bug, the repository, the new name and the tracker', () => {
    expect(
      subjectOf({
        call: { name: 'run_details', args: { workspace: 'w1', run: 'r-01' } },
        state,
      }),
    ).toBe('r-01');
    expect(
      subjectOf({ call: { name: 'run_details', args: { workspace: 'w1' } }, state }),
    ).toBe('Checkout regression');
    expect(
      subjectOf({
        call: { name: 'bug_details', args: { workspace: 'w1', bug: 'BUG-01' } },
        state,
      }),
    ).toBe('BUG-01');
    expect(
      subjectOf({
        call: { name: 'link_repository', args: { project: 'p1', repository: 'acme/x' } },
        state,
      }),
    ).toBe('acme/x');
    expect(
      subjectOf({
        call: { name: 'rename_workspace', args: { workspace: 'w1', name: 'Pix' } },
        state,
      }),
    ).toBe('Pix');
    expect(
      subjectOf({
        call: { name: 'connect_integration', args: { integration: 'jira' } },
        state,
      }),
    ).toBe('Jira');
  });

  it('names nothing for a call that touches nothing in particular', () => {
    expect(subjectOf({ call: { name: 'go_home', args: {} }, state })).toBe('');
  });
});
