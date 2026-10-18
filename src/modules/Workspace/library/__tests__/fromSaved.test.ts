import { describe, expect, it } from 'vitest';
import { fromSaved, toSaved } from '@/modules/Workspace/library';
import { makeWorkspace } from './fixtures';

const SAVED = toSaved(makeWorkspace());

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
      fromSaved(toSaved({ ...makeWorkspace(), viewportId: 'tablet' }))?.viewportId,
    ).toBe('tablet');

    const json = JSON.stringify({ id: 'w1', projectId: 'p1' });

    expect(fromSaved({ id: 'w1', json, planYaml: '' })?.viewportId).toBe('desktop');
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
});
