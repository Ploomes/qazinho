import type { IWorkspace } from '@/modules/Workspace';
import { describe, expect, it } from 'vitest';
import { islandStateOf } from '@/modules/Island/library';
import { startRun } from '@/modules/Workspace/library';
import {
  makeOutcome,
  makeWorkspace,
  QUESTION,
  WALKED_BY,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { endRun } from '@/modules/Workspace/library/endRun';
import { landAsked } from '@/modules/Workspace/library/landAsked';
import { landStep } from '@/modules/Workspace/library/landStep';

const running = (props: { id?: string; caseIds?: string[]; kind?: 'explore' }) =>
  startRun({
    workspace: { ...makeWorkspace(), id: props.id ?? 'w1' },
    startedAt: '10:00',
    runId: 'r-01',
    by: WALKED_BY,
    ...(props.kind === undefined ? {} : { kind: props.kind }),
    ...(props.caseIds === undefined ? {} : { caseIds: props.caseIds }),
  });

describe('islandStateOf', () => {
  it('has nothing to show while no run goes', () => {
    expect(islandStateOf({ workspaces: [makeWorkspace()], projects: [] })).toEqual({
      kind: 'idle',
    });
    expect(islandStateOf({ workspaces: [], projects: [] })).toEqual({ kind: 'idle' });
  });

  it('shows the step a run is on, out of every step of the plan', () => {
    const workspace = running({});
    const walked = landStep({
      workspace,
      outcome: makeOutcome({ workspace, index: 0, verdict: 'passed' }),
      at: '10:01',
    });

    expect(islandStateOf({ workspaces: [walked], projects: [] })).toEqual({
      kind: 'running',
      workspaceId: 'w1',
      name: 'Checkout regression',
      detail: 'Search for a product',
      done: 1,
      total: 6,
      isExploring: false,
      isPaused: false,
    });
  });

  it('counts only the steps of the cases a run was asked for', () => {
    expect(
      islandStateOf({ workspaces: [running({ caseIds: ['TC-02'] })], projects: [] }),
    ).toMatchObject({
      total: 3,
      detail: 'Add the product to the cart',
    });
  });

  it('has no total for an exploration, which has no plan to count', () => {
    expect(
      islandStateOf({ workspaces: [running({ kind: 'explore' })], projects: [] }),
    ).toMatchObject({
      kind: 'running',
      isExploring: true,
      total: 0,
      detail: '',
    });
  });

  it('puts every question waiting for the QA before a run that goes, with where it came from', () => {
    const asking = landAsked({ workspace: running({ id: 'w2' }), question: QUESTION });

    expect(
      islandStateOf({
        workspaces: [running({ id: 'w1' }), asking],
        projects: [{ id: 'p1', name: 'Loja', targets: [], repositories: [] }],
      }),
    ).toEqual({
      kind: 'asking',
      questions: [
        {
          workspaceId: 'w2',
          questionId: 'q-1',
          project: 'Loja',
          workspace: 'Checkout regression',
          question: 'Which plan should I pick?',
          options: ['Premium', 'Premium+'],
          isSecret: false,
        },
      ],
    });
  });

  it('lists the questions from the oldest, whatever the order of the workspaces', () => {
    const newer = landAsked({
      workspace: running({ id: 'w1' }),
      question: { ...QUESTION, id: 'q-new', askedAtMs: QUESTION.askedAtMs + 5_000 },
    });
    const older = landAsked({ workspace: running({ id: 'w2' }), question: QUESTION });
    const state = islandStateOf({ workspaces: [newer, older], projects: [] });

    expect(
      state.kind === 'asking' && state.questions.map(({ questionId }) => questionId),
    ).toEqual(['q-1', 'q-new']);
  });

  it('leaves the project out when the workspace has none anymore', () => {
    const state = islandStateOf({
      workspaces: [landAsked({ workspace: running({}), question: QUESTION })],
      projects: [],
    });

    expect(state.kind === 'asking' && state.questions[0]?.project).toBe('');
  });

  it('does NOT show a run that is over', () => {
    const ended: IWorkspace = endRun({
      workspace: running({}),
      at: '10:05',
      endedBy: 'finished',
    });

    expect(islandStateOf({ workspaces: [ended], projects: [] })).toEqual({
      kind: 'idle',
    });
  });
});
