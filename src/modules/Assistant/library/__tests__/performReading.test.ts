import { describe, expect, it } from 'vitest';
import { performReading } from '@/modules/Assistant/library';
import { fakePort } from './fixtures';

const { state } = fakePort();

describe('performReading', () => {
  it('reads a workspace named by its name', () => {
    expect(
      performReading({
        call: { name: 'workspace_details', args: { workspace: 'checkout regression' } },
        state,
      }).text,
    ).toContain('Workspace w1 "Checkout regression"');
  });

  it('reads a run and a bug of a workspace named by its id', () => {
    expect(
      performReading({ call: { name: 'run_details', args: { workspace: 'w1' } }, state })
        .text,
    ).toContain('Run r-01 of w1');
    expect(
      performReading({
        call: { name: 'bug_details', args: { workspace: 'w1', bug: 'BUG-01' } },
        state,
      }).text,
    ).toContain('Bug BUG-01 of w1');
  });

  it('does NOT read a workspace that is not there', () => {
    expect(
      performReading({
        call: { name: 'workspace_details', args: { workspace: 'Pix' } },
        state,
      }),
    ).toEqual({
      text: 'There is no workspace "Pix". The workspaces are w1 "Checkout regression", w2 "Login".',
      isError: true,
    });
  });
});
