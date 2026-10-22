import { describe, expect, it } from 'vitest';
import { appSnapshotOf } from '@/modules/Assistant/library';
import { CHECKOUT, LOGIN, PROJECT } from './fixtures';

const BASE = {
  screen: 'workspace' as const,
  selectedWorkspaceId: 'w1',
  tab: 'runs' as const,
  selectedRunId: null,
  openBugId: null,
  language: 'pt' as const,
  theme: 'dark' as const,
  runAlert: 'system' as const,
  agent: 'Claude Code',
  integrations: [
    { id: 'github' as const, account: 'octoqa', site: null, connectedAt: '2026-10-20' },
  ],
  projects: [PROJECT],
  workspaces: [CHECKOUT, LOGIN],
  askingIds: ['w2'],
  variables: { p1: [{ name: 'LOJA_EMAIL', description: 'A buyer on staging' }] },
};

describe('appSnapshotOf', () => {
  it('tells the workspace on screen, its tab and the run open there, the latest when none was picked', () => {
    expect(appSnapshotOf(BASE)).toMatchObject({
      screen: 'workspace',
      openWorkspaceId: 'w1',
      openTab: 'runs',
      openRunId: 'r-01',
      openBugId: null,
      theme: 'night',
    });
  });

  it('sums every workspace up: its target, plan, runs, bugs and what it is busy with', () => {
    const { workspaces } = appSnapshotOf(BASE);

    expect(workspaces).toEqual([
      {
        id: 'w1',
        name: 'Checkout regression',
        projectId: 'p1',
        target: 'web',
        cases: 2,
        steps: 6,
        runs: 1,
        bugs: 1,
        latestRun: {
          id: 'r-01',
          startedOn: new Date(1_760_000_000_000).toLocaleDateString('sv-SE'),
          startedAt: '09:41',
          endedBy: 'finished',
          passed: 5,
          failed: 1,
          blocked: 0,
          skipped: 0,
        },
        isRunning: false,
        isAnswering: false,
        openQuestions: 0,
        design: null,
      },
      {
        id: 'w2',
        name: 'Login',
        projectId: 'p1',
        target: 'android',
        cases: 0,
        steps: 0,
        runs: 0,
        bugs: 0,
        latestRun: null,
        isRunning: false,
        isAnswering: true,
        openQuestions: 0,
        design: null,
      },
    ]);
  });

  it('names each tracker, connected or not, and each repository as owner/name', () => {
    const snapshot = appSnapshotOf(BASE);

    expect(snapshot.integrations).toEqual([
      { id: 'github', account: 'octoqa' },
      { id: 'jira', account: null },
    ]);
    expect(snapshot.projects[0]?.repositories).toEqual([
      { name: 'acme/loja-web', base: 'develop' },
    ]);
  });

  it('says home when the workspace on screen is gone, and opens nothing on settings', () => {
    expect(appSnapshotOf({ ...BASE, selectedWorkspaceId: 'w9' })).toMatchObject({
      screen: 'home',
      openWorkspaceId: null,
      openTab: null,
      openRunId: null,
    });
    expect(appSnapshotOf({ ...BASE, screen: 'settings', theme: 'light' })).toMatchObject({
      screen: 'settings',
      openWorkspaceId: null,
      theme: 'paper',
    });
  });

  it('opens a bug only on the bugs tab', () => {
    expect(appSnapshotOf({ ...BASE, tab: 'bugs', openBugId: 'BUG-01' })).toMatchObject({
      openTab: 'bugs',
      openRunId: null,
      openBugId: 'BUG-01',
    });
    expect(appSnapshotOf({ ...BASE, tab: 'plan', openBugId: 'BUG-01' })).toMatchObject({
      openBugId: null,
    });
  });
  it("tells each project's variables by name and what each holds, never a value", () => {
    const [project] = appSnapshotOf(BASE).projects;

    expect(project?.variables).toEqual([
      { name: 'LOJA_EMAIL', description: 'A buyer on staging' },
    ]);
    expect(appSnapshotOf({ ...BASE, variables: {} }).projects[0]?.variables).toEqual([]);
  });
});
