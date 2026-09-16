import { describe, expect, it } from 'vitest';
import { buildProcessTree } from '@/modules/Resources/library';
import { startRun } from '@/modules/Workspace/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';

const PROJECT = { id: 'p1', name: 'Shop · staging', targets: [] };
const RUNNING = startRun({
  workspace: makeWorkspace(),
  startedAt: '09:41',
  runId: 'r-01',
});

describe('buildProcessTree', () => {
  it('shows nothing while nothing is running', () => {
    const tree = buildProcessTree({ projects: [PROJECT], workspaces: [makeWorkspace()] });

    expect(tree).toEqual([]);
  });

  it('nests the agent and the device under the workspace that owns them', () => {
    const tree = buildProcessTree({ projects: [PROJECT], workspaces: [RUNNING] });

    expect(tree.map(({ level }) => level)).toEqual([0, 1, 2, 2]);
    expect(tree[3]?.name).toBe('Chromium 1280 × 800');
  });

  it('rolls the workspace cost up into the project', () => {
    const tree = buildProcessTree({ projects: [PROJECT], workspaces: [RUNNING] });

    expect(tree[0]?.cpu).toBe(16);
    expect(tree[0]?.ramGb).toBeCloseTo(2.22);
  });

  it('charges an emulator more than a browser, because it costs more', () => {
    const mobile = { ...RUNNING, planKind: 'mobile' as const };

    const tree = buildProcessTree({ projects: [PROJECT], workspaces: [mobile] });

    expect(tree[3]?.name).toBe('Emulator · Pixel 7 · API 34');
    expect(tree[3]?.ramGb).toBe(4.4);
  });

  it('only lets a device be shut down, never an agent', () => {
    const tree = buildProcessTree({ projects: [PROJECT], workspaces: [RUNNING] });

    expect(tree.filter(({ canShutDown }) => canShutDown)).toHaveLength(1);
  });
});
