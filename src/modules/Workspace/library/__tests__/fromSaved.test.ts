import { describe, expect, it } from 'vitest';
import { fromSaved, toSaved } from '@/modules/Workspace/library';
import { makeWorkspace } from './fixtures';

const SAVED = toSaved({ workspace: makeWorkspace(), at: '09:44' });

describe('fromSaved', () => {
  it('a workspace file that is not json is left out, not a crash', () => {
    expect(fromSaved({ id: 'w1', json: '{ nope', planYaml: '' })).toBeNull();
  });

  it('a workspace with no id belongs to no project, so it is left out', () => {
    const json = JSON.stringify({ name: 'orphan' });

    expect(fromSaved({ id: 'w1', json, planYaml: '' })).toBeNull();
  });

  it('a plan somebody broke by hand loses the plan, not the workspace', () => {
    const workspace = fromSaved({ ...SAVED, planYaml: 'cases: [ nope' });

    expect(workspace?.name).toBe('Checkout regression');
    expect(workspace?.plan).toEqual([]);
  });

  it('keeps the window size the workspace picked, and opens one saved before sizes at desktop', () => {
    expect(
      fromSaved(
        toSaved({ workspace: { ...makeWorkspace(), viewportId: 'tablet' }, at: '09:44' }),
      )?.viewportId,
    ).toBe('tablet');

    const json = JSON.stringify({ id: 'w1', projectId: 'p1' });

    expect(fromSaved({ id: 'w1', json, planYaml: '' })?.viewportId).toBe('desktop');
  });

  /** O plano escrito antes do app continua esperando a história depois de um reinício. */
  it('keeps where the story of a plan written ahead of the app stands', () => {
    expect(
      fromSaved(
        toSaved({ workspace: { ...makeWorkspace(), storyStage: 'ahead' }, at: '09:44' }),
      )?.storyStage,
    ).toBe('ahead');

    const json = JSON.stringify({ id: 'w1', projectId: 'p1', storyStage: 'late' });

    expect(fromSaved({ id: 'w1', json, planYaml: '' })).not.toHaveProperty('storyStage');
  });

  it('keeps the code a plan was made from across a restart, and none for an older file', () => {
    const source = {
      repository: 'acme/loja-web',
      branch: 'feat/cupom',
      base: 'develop',
      commit: 'c0ffee0123',
    };

    expect(
      fromSaved(
        toSaved({ workspace: { ...makeWorkspace(), planSource: source }, at: '09:44' }),
      )?.planSource,
    ).toEqual(source);

    const json = JSON.stringify({ id: 'w1', projectId: 'p1' });

    expect(fromSaved({ id: 'w1', json, planYaml: '' })?.planSource).toBeNull();
  });

  it('never comes back running, because nothing on the machine is', () => {
    const json = JSON.stringify({ id: 'w1', projectId: 'p1', status: 'running' });

    expect(fromSaved({ id: 'w1', json, planYaml: '' })?.live).toBeNull();
  });

  it('keeps how full the context window was, and drops one that is not numbers', () => {
    const kept = JSON.stringify({
      id: 'w1',
      projectId: 'p1',
      context: { tokens: 40, window: 200 },
    });
    const broken = JSON.stringify({
      id: 'w1',
      projectId: 'p1',
      context: { tokens: 'a' },
    });

    expect(fromSaved({ id: 'w1', json: kept, planYaml: '' })?.context).toEqual({
      tokens: 40,
      window: 200,
    });
    expect(fromSaved({ id: 'w1', json: broken, planYaml: '' })?.context).toBeNull();
  });

  it('reads a run saved before runs said how they ended as one that finished', () => {
    const json = JSON.stringify({
      id: 'w1',
      projectId: 'p1',
      chat: [
        { id: 'm-1', kind: 'run', at: '09:42', runId: 'r-01', passed: 1, failed: 0 },
      ],
      runs: [
        {
          id: 'r-01',
          title: 'Run r-01',
          what: 'The whole plan',
          meta: 'Checkout regression',
          startedAt: '09:41',
          durationSec: 4,
          counts: { passed: 1, failed: 0, blocked: 0, skipped: 0 },
          cases: [],
        },
      ],
    });
    const workspace = fromSaved({ id: 'w1', json, planYaml: '' });

    expect(workspace?.runs[0]?.endedBy).toBe('finished');
    expect(workspace?.chat[0]).toMatchObject({ kind: 'run', endedBy: 'finished' });
  });

  it('drops the English title an older run kept, which Runs now writes itself', () => {
    const json = JSON.stringify({
      id: 'w1',
      projectId: 'p1',
      runs: [
        {
          id: 'r-01',
          title: 'Run r-01 · the whole plan',
          what: 'The whole plan',
          meta: 'Checkout regression',
          startedAt: '09:41',
          durationSec: 4,
          counts: { passed: 1, failed: 0, blocked: 0, skipped: 0 },
          cases: [],
          endedBy: 'finished',
        },
      ],
    });
    const run = fromSaved({ id: 'w1', json, planYaml: '' })?.runs[0];

    expect(run).not.toHaveProperty('title');
    expect(run).not.toHaveProperty('what');
  });

  it('drops the action logs an older chat still carries', () => {
    const json = JSON.stringify({
      id: 'w1',
      projectId: 'p1',
      chat: [
        { id: 'm-1', kind: 'user', at: '09:41', text: 'hi' },
        { id: 'm-2', kind: 'action', at: '09:42', actions: [] },
      ],
    });

    expect(
      fromSaved({ id: 'w1', json, planYaml: '' })?.chat.map(({ kind }) => kind),
    ).toEqual(['user']);
  });

  it('reads a run saved before recordings as one with no video, its steps out of time', () => {
    const json = JSON.stringify({
      id: 'w1',
      projectId: 'p1',
      runs: [
        {
          id: 'r-01',
          meta: 'Checkout regression',
          startedAt: '09:41',
          durationSec: 4,
          counts: { passed: 1, failed: 0, blocked: 0, skipped: 0 },
          cases: [
            {
              id: 'TC-01',
              title: 'Sign in',
              verdict: 'passed',
              durationSec: 4,
              steps: [
                {
                  number: 1,
                  action: 'Open the page',
                  verdict: 'passed',
                  why: null,
                  bugId: null,
                  shot: null,
                  shotFile: null,
                },
              ],
            },
          ],
          endedBy: 'finished',
        },
      ],
    });
    const run = fromSaved({ id: 'w1', json, planYaml: '' })?.runs[0];

    expect(run?.video).toBeNull();
    expect(run?.cases[0]?.steps[0]?.span).toBeNull();
  });

  it('keeps the plan set aside, from disk or from what it saved, until the QA deals with it', () => {
    const unreadPlan = { file: 'plan.unread-20261023-052607.yaml', line: 7 };
    const fresh = fromSaved({ ...SAVED, unreadPlan });

    expect(fresh?.unreadPlan).toEqual(unreadPlan);
    expect(
      fromSaved({
        id: 'w1',
        planYaml: '',
        json: toSaved({ workspace: { ...makeWorkspace(), unreadPlan }, at: '09:44' })
          .json,
      })?.unreadPlan,
    ).toEqual(unreadPlan);
    expect(fromSaved(SAVED)?.unreadPlan).toBeNull();
  });

  it('keeps what the QA said is no secret across a restart', () => {
    const json = toSaved({
      workspace: { ...makeWorkspace(), plainValues: ['12345'] },
      at: '09:44',
    }).json;

    expect(fromSaved({ id: 'w1', json, planYaml: '' })?.plainValues).toEqual(['12345']);
    expect(fromSaved(SAVED)?.plainValues).toEqual([]);
  });
});
