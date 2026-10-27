import type { ConfirmDecision, IAppPort, IAppState } from '@/modules/Assistant/types';
import type { IProject } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type {
  BugFiling,
  IBranchList,
  IRepositoryList,
  VariablesOutcome,
} from '@/shared/types';
import { makeWorkspace, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

export const PROJECT: IProject = {
  id: 'p1',
  name: 'Lojinha',
  targets: [
    { id: 't1', kind: 'web', label: 'Web', value: 'https://loja.test' },
    { id: 't-android', kind: 'android', label: 'Android', value: '/builds/loja.apk' },
  ],
  repositories: [{ id: '101', owner: 'acme', name: 'loja-web', baseBranch: 'develop' }],
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
      id: '101',
      owner: 'acme',
      name: 'loja-web',
      isPrivate: true,
      defaultBranch: 'develop',
      pushedAt: '2026-10-20T10:00:00Z',
      description: null,
    },
    {
      id: '102',
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
    kept?: string[] | null;
    applied?: VariablesOutcome;
    filing?: BugFiling;
  } = {},
) {
  const state: IAppState = {
    projects: [PROJECT],
    workspaces: [CHECKOUT, LOGIN],
    askingIds: [],
    integrations: [
      {
        id: 'github',
        account: 'octoqa',
        site: null,
        connectedAt: '2026-10-20T10:00:00Z',
      },
    ],
    builds: [],
    hasAndroidSdk: true,
    hasXcode: true,
    variables: {},
    ...props.state,
  };
  const did: string[] = [];
  const port: IAppPort = {
    read: () => state,
    now: () => 1_760_000_000_000,
    targetLabel: (kind) => `label ${kind}`,
    themeName: (theme) => (theme === 'dark' ? 'Noite' : 'Papel'),
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
    dismissBug: ({ workspaceId, bugId, isDismissed }) => {
      state.workspaces = state.workspaces.map((one) =>
        one.id === workspaceId
          ? {
              ...one,
              bugs: one.bugs.map((bug) =>
                bug.id === bugId ? { ...bug, isDismissed } : bug,
              ),
            }
          : one,
      );
      did.push(`${isDismissed ? 'dismiss' : 'reopen'} ${bugId}`);
    },
    setDesign: ({ workspaceId, design }) => {
      state.workspaces = state.workspaces.map((one) =>
        one.id === workspaceId ? { ...one, design } : one,
      );
      did.push(`design ${workspaceId} ${design?.fileKey ?? 'none'}`);
    },
    removeWorkspace: (workspaceId) => {
      state.workspaces = state.workspaces.filter(({ id }) => id !== workspaceId);
      did.push(`remove workspace ${workspaceId}`);
    },
    runWorkspace: (workspaceId) => {
      did.push(`run ${workspaceId}`);

      return props.runId === undefined ? 'r-02' : props.runId;
    },
    exploreWorkspace: (workspaceId) => {
      did.push(`explore ${workspaceId}`);

      return props.runId === undefined ? 'r-02' : props.runId;
    },
    stopWorkspace: (workspaceId) => {
      did.push(`stop ${workspaceId}`);
    },
    askWorkspaceChat: ({ workspaceId, text, story, page, design }) => {
      did.push(
        `ask ${workspaceId} ${text}${story === null ? '' : ` from ${story.key}`}${page === null ? '' : ` from page ${page.id}`}${design === null ? '' : ` against ${design.fileKey}`}`,
      );
    },
    findPage: (query) =>
      Promise.resolve(
        /cupom/i.test(query)
          ? {
              id: '98304',
              title: 'Checkout: cenários do cupom',
              space: 'QA',
              url: 'https://acme.atlassian.net/wiki/spaces/QA/pages/98304',
            }
          : query === 'off'
            ? 'not-connected'
            : 'not-found',
      ),
    findStory: (key) =>
      Promise.resolve(
        key === 'SHOP-12'
          ? {
              key: 'SHOP-12',
              summary: 'Aplicar cupom',
              url: 'https://acme.atlassian.net/browse/SHOP-12',
            }
          : 'not-found',
      ),
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
    startBuild: (build) => {
      did.push(
        `build ${build.projectId} ${build.platform} ${build.repository.owner}/${build.repository.name}@${build.branch}`,
      );

      return 'b-1';
    },
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
    askVariables: ({ projectId, drafts }) => {
      did.push(`ask ${projectId} ${drafts.map(({ name }) => name).join(',')}`);

      return Promise.resolve(
        props.kept === undefined ? drafts.map(({ name }) => name) : props.kept,
      );
    },
    applyVariables: (apply) => {
      did.push(`apply ${apply.projectId} ${JSON.stringify(apply.changes)}`);

      return Promise.resolve(props.applied ?? { isSaved: true, variables: [] });
    },
    sendBug: ({ workspaceId, bugId, target }) => {
      did.push(
        `send ${workspaceId} ${bugId} ${target.tracker === 'jira' ? target.project : `${target.owner}/${target.name}`}`,
      );

      return Promise.resolve(
        props.filing ?? {
          isFiled: true,
          issue: {
            tracker: target.tracker,
            key: target.tracker === 'jira' ? `${target.project}-57` : '#42',
            url: 'https://tracker.test/57',
            at: '2026-10-22T12:00:00.000Z',
          },
          missed: [],
          linked: null,
        },
      );
    },
    confirm: (asked) => {
      did.push(
        `confirm ${asked.action} ${asked.subject} ${String(asked.count)}${asked.detail === undefined ? '' : ` ${asked.detail}`}`,
      );

      return Promise.resolve(props.decision ?? 'confirmed');
    },
  };

  return { port, state, did };
}
