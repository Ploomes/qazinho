import type { ConfirmDecision, IAppPort, IAppState } from '@/modules/Assistant/types';
import type { IProject } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IBranchList, IRepositoryList } from '@/shared/types';
import { makeWorkspace, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

export const PROJECT: IProject = {
  id: 'p1',
  name: 'Lojinha',
  targets: [
    { id: 't1', kind: 'web', label: 'Web', value: 'https://loja.test' },
    { id: 't-android', kind: 'android', label: 'Android', value: '/builds/loja.apk' },
  ],
  repositories: [{ owner: 'acme', name: 'loja-web', baseBranch: 'develop' }],
};

/** w1, "Checkout regression": a plan of two cases, run r-01 finished with one failed step, and BUG-01. */
export const CHECKOUT: IWorkspace = walkRun({
  verdicts: ['passed', 'failed', 'passed', 'passed', 'passed', 'passed'],
  isFinished: true,
});

/** w2, "Login": on the project's Android target, with nothing in it yet. */
export const LOGIN: IWorkspace = {
  ...makeWorkspace([]),
  id: 'w2',
  name: 'Login',
  targetId: 't-android',
  planKind: 'mobile',
};

export const REPOSITORIES: IRepositoryList = {
  isListed: true,
  repositories: [
    {
      owner: 'acme',
      name: 'loja-web',
      isPrivate: true,
      defaultBranch: 'develop',
      pushedAt: '2026-10-20T10:00:00Z',
      description: null,
    },
    {
      owner: 'acme',
      name: 'loja-app',
      isPrivate: false,
      defaultBranch: 'main',
      pushedAt: null,
      description: 'The phone app',
    },
  ],
};

/** A QAzinho in memory behind the port: every change lands in its state, and every call is written down in `did`. */
export function fakePort(
  props: {
    state?: Partial<IAppState>;
    decision?: ConfirmDecision;
    repositories?: IRepositoryList;
    branches?: IBranchList;
    runId?: string | null;
  } = {},
) {
  const state: IAppState = {
    projects: [PROJECT],
    workspaces: [CHECKOUT, LOGIN],
    integrations: [
      {
        id: 'github',
        account: 'octoqa',
        site: null,
        connectedAt: '2026-10-20T10:00:00Z',
      },
    ],
    ...props.state,
  };
  const did: string[] = [];
  const port: IAppPort = {
    read: () => state,
    now: () => 1_760_000_000_000,
    targetLabel: (kind) => `label ${kind}`,
    openWorkspace: (open) => {
      did.push(
        `open ${open.workspaceId} ${open.tab} ${open.runId ?? '-'} ${open.bugId ?? '-'}`,
      );
    },
    openProject: (projectId) => {
      did.push(`project ${projectId}`);
    },
    openSettings: (section) => {
      did.push(`settings ${section ?? '-'}`);
    },
    goHome: () => {
      did.push('home');
    },
    putProject: (project) => {
      state.projects = [...state.projects.filter(({ id }) => id !== project.id), project];
      did.push(`put ${project.id}`);
    },
    removeProject: (projectId) => {
      state.projects = state.projects.filter(({ id }) => id !== projectId);
      state.workspaces = state.workspaces.filter((one) => one.projectId !== projectId);
      did.push(`remove project ${projectId}`);
    },
    addWorkspace: (workspace) => {
      state.workspaces = [...state.workspaces, workspace];
      did.push(`add ${workspace.id}`);
    },
    renameWorkspace: ({ workspaceId, name }) => {
      state.workspaces = state.workspaces.map((one) =>
        one.id === workspaceId ? { ...one, name } : one,
      );
      did.push(`rename ${workspaceId} ${name}`);
    },
    removeWorkspace: (workspaceId) => {
      state.workspaces = state.workspaces.filter(({ id }) => id !== workspaceId);
      did.push(`remove workspace ${workspaceId}`);
    },
    runWorkspace: (workspaceId) => {
      did.push(`run ${workspaceId}`);

      return props.runId === undefined ? 'r-02' : props.runId;
    },
    stopWorkspace: (workspaceId) => {
      did.push(`stop ${workspaceId}`);
    },
    changeSettings: (settings) => {
      did.push(`change ${JSON.stringify(settings)}`);
    },
    connectIntegration: (id) => {
      did.push(`connect ${id}`);
    },
    disconnectIntegration: (id) => {
      state.integrations = state.integrations.filter((one) => one.id !== id);
      did.push(`disconnect ${id}`);

      return Promise.resolve();
    },
    listRepositories: () => Promise.resolve(props.repositories ?? REPOSITORIES),
    listBranches: () =>
      Promise.resolve(
        props.branches ?? {
          isListed: true,
          branches: [
            { name: 'main', isDefault: true, pullRequest: null, movedAt: null },
            { name: 'release', isDefault: false, pullRequest: null, movedAt: null },
          ],
        },
      ),
    confirm: (asked) => {
      did.push(`confirm ${asked.action} ${asked.subject} ${String(asked.count)}`);

      return Promise.resolve(props.decision ?? 'confirmed');
    },
  };

  return { port, state, did };
}
