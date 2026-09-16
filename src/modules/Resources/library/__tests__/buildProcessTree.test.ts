import { describe, expect, it } from 'vitest';
import { buildProcessTree } from '@/modules/Resources/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { sample } from './fixtures';

const PROJECT = { id: 'p1', name: 'Shop · staging', targets: [] };
const WORKSPACE = makeWorkspace();

const RUNNING = [
  sample({ name: 'gocrash', kind: 'app', ramMb: 300 }),
  sample({ name: 'claude', kind: 'agent', workspaceId: 'w1', ramMb: 420 }),
  sample({ name: 'Google Chrome', kind: 'device', workspaceId: 'w1', ramMb: 1024 }),
  sample({ name: 'Google Chrome Helper', kind: 'device', workspaceId: 'w1', ramMb: 512 }),
];

describe('buildProcessTree', () => {
  it('shows nothing while nothing of this project is running', () => {
    const tree = buildProcessTree({
      projects: [PROJECT],
      workspaces: [WORKSPACE],
      processes: [sample({ name: 'gocrash', kind: 'app' })],
    });

    expect(tree).toEqual([]);
  });

  it('nests the agent and the device under the workspace that owns them', () => {
    const tree = buildProcessTree({
      projects: [PROJECT],
      workspaces: [WORKSPACE],
      processes: RUNNING,
    });

    expect(tree.map(({ level }) => level)).toEqual([0, 1, 2, 2]);
    expect(tree[2]?.name).toBe('claude');
    expect(tree[3]?.name).toBe('Google Chrome · 2 processes');
  });

  it('adds a browser up into one line, because the QA reads one browser', () => {
    const tree = buildProcessTree({
      projects: [PROJECT],
      workspaces: [WORKSPACE],
      processes: RUNNING,
    });

    expect(tree[3]?.ramGb).toBeCloseTo(1.5);
  });

  it('rolls the workspace cost up into the project', () => {
    const tree = buildProcessTree({
      projects: [PROJECT],
      workspaces: [WORKSPACE],
      processes: RUNNING,
    });

    expect(tree[0]?.cpu).toBe(12);
    expect(tree[0]?.ramGb).toBeCloseTo(1.91);
  });

  it('calls the device an emulator when the plan is a mobile one', () => {
    const tree = buildProcessTree({
      projects: [PROJECT],
      workspaces: [{ ...WORKSPACE, planKind: 'mobile' }],
      processes: RUNNING,
    });

    expect(tree[3]?.name).toBe('Emulator · Pixel 7 · API 34');
  });

  it('only lets a device be shut down, never an agent', () => {
    const tree = buildProcessTree({
      projects: [PROJECT],
      workspaces: [WORKSPACE],
      processes: RUNNING,
    });

    expect(tree.filter(({ canShutDown }) => canShutDown)).toHaveLength(1);
  });

  it('a workspace with an agent and no device still shows up', () => {
    const tree = buildProcessTree({
      projects: [PROJECT],
      workspaces: [WORKSPACE],
      processes: [sample({ name: 'claude', kind: 'agent', workspaceId: 'w1' })],
    });

    expect(tree.map(({ level }) => level)).toEqual([0, 1, 2]);
  });
});
