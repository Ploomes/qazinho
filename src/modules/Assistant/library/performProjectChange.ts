import type { IAppPort, IToolDone } from '@/modules/Assistant/types';
import type { IProject, IProjectRepository, ITarget } from '@/modules/Project/types';
import type { AppToolCall, GithubFailure, IRepository, TargetKind } from '@/shared/types';
import { newProjectId, webAddressOf } from '@/modules/Project/library';
import { findByRef } from './findByRef';
import { repositoryOfName } from './repositoryOfName';

type ProjectCall = Extract<
  AppToolCall,
  {
    name:
      | 'create_project'
      | 'update_project'
      | 'link_repository'
      | 'unlink_repository'
      | 'list_repositories';
  }
>;

const KINDS: TargetKind[] = ['web', 'android', 'ios'];

const GITHUB_SAYS: Record<GithubFailure, string> = {
  'no-cli': 'the GitHub CLI is not installed on this machine',
  'signed-out': 'the GitHub CLI is signed out',
  denied: 'GitHub refused it for this account',
  'not-found': 'GitHub did not find it, or this account cannot see it',
  unreachable: 'GitHub is out of reach from this machine',
  unexpected: 'GitHub answered in a way QAzinho did not expect',
};

const NEEDS_TARGET =
  'A project needs at least one target: a web address, an Android .apk or an iOS simulator .app.';

function failed(text: string): IToolDone {
  return { text, isError: true };
}

async function readable(
  port: IAppPort,
): Promise<{ isOk: true; repositories: IRepository[] } | { isOk: false; text: string }> {
  if (!port.read().integrations.some(({ id }) => id === 'github'))
    return {
      isOk: false,
      text: 'GitHub is not connected to QAzinho: connect it first with connect_integration.',
    };

  const listed = await port.listRepositories();

  return listed.isListed
    ? { isOk: true, repositories: listed.repositories }
    : {
        isOk: false,
        text: `GitHub did not list the repositories: ${GITHUB_SAYS[listed.failure]}.`,
      };
}

function sameRepository(props: {
  repository: { owner: string; name: string };
  named: { owner: string; name: string };
}): boolean {
  return (
    props.repository.owner.toLowerCase() === props.named.owner.toLowerCase() &&
    props.repository.name.toLowerCase() === props.named.name.toLowerCase()
  );
}

function targetsText(targets: ITarget[]): string {
  return targets.map(({ kind, value }) => `${kind} ${value}`).join(', ');
}

async function listRepositories(port: IAppPort): Promise<IToolDone> {
  const read = await readable(port);

  if (!read.isOk) return failed(read.text);

  if (read.repositories.length === 0)
    return { text: 'The QA cannot read any repository on GitHub.', isError: false };

  const shown = read.repositories.slice(0, 40);

  return {
    text: [
      `The QA can read ${String(read.repositories.length)} repositories on GitHub:`,
      ...shown.map(
        (repository) =>
          `- ${repository.owner}/${repository.name}${repository.isPrivate ? ' (private)' : ''}, default branch ${repository.defaultBranch}`,
      ),
      ...(read.repositories.length > shown.length
        ? [`and ${String(read.repositories.length - shown.length)} more.`]
        : []),
    ].join('\n'),
    isError: false,
  };
}

async function createProject(props: {
  args: Extract<ProjectCall, { name: 'create_project' }>['args'];
  port: IAppPort;
}): Promise<IToolDone> {
  const { args, port } = props;
  const web = args.web === undefined || args.web === '' ? null : webAddressOf(args.web);

  if (args.web !== undefined && args.web !== '' && web === null)
    return failed(`"${args.web}" is not a web address.`);

  const values: Record<TargetKind, string | null> = {
    web,
    android: args.android === undefined || args.android === '' ? null : args.android,
    ios: args.ios === undefined || args.ios === '' ? null : args.ios,
  };
  const targets = KINDS.flatMap((kind): ITarget[] => {
    const value = values[kind];

    return value === null
      ? []
      : [{ id: `t-${kind}`, kind, label: port.targetLabel(kind), value }];
  });

  if (targets.length === 0) return failed(NEEDS_TARGET);

  const named = args.repositories ?? [];
  const repositories: IProjectRepository[] = [];

  if (named.length > 0) {
    const read = await readable(port);

    if (!read.isOk) return failed(read.text);

    for (const text of named) {
      const wanted = repositoryOfName(text);

      if (wanted === null) return failed(`"${text}" is not a repository as owner/name.`);

      const repository = read.repositories.find((one) =>
        sameRepository({ repository: one, named: wanted }),
      );

      if (repository === undefined)
        return failed(`The QA cannot read ${text} on GitHub, or it does not exist.`);

      repositories.push({
        owner: repository.owner,
        name: repository.name,
        baseBranch: repository.defaultBranch,
      });
    }
  }

  const project: IProject = {
    id: newProjectId(port.now()),
    name: args.name,
    targets,
    repositories,
  };

  port.putProject(project);

  return {
    text: `Created project ${project.id} "${project.name}" on ${targetsText(targets)}${
      repositories.length === 0
        ? ''
        : `, made of ${repositories.map(({ owner, name }) => `${owner}/${name}`).join(', ')}`
    }. Workspaces can be made in it now.`,
    isError: false,
  };
}

function updateProject(props: {
  args: Extract<ProjectCall, { name: 'update_project' }>['args'];
  port: IAppPort;
}): IToolDone {
  const { args, port } = props;
  const state = port.read();
  const found = findByRef({ items: state.projects, ref: args.project, noun: 'project' });

  if (!found.isFound) return failed(found.text);

  const project = found.item;
  const changes: string[] = [];

  if (args.name !== undefined && args.name.trim() === '')
    return failed('A project needs a name.');

  const name = args.name === undefined ? project.name : args.name.trim();

  if (name !== project.name) changes.push(`renamed it "${name}"`);

  const targets: ITarget[] = [];

  for (const kind of KINDS) {
    const kept = project.targets.find((target) => target.kind === kind) ?? null;
    const typed = args[kind];

    if (typed === undefined) {
      if (kept !== null) targets.push(kept);

      continue;
    }

    if (typed === '') {
      if (kept === null) continue;

      const user = state.workspaces.find(
        (workspace) =>
          workspace.projectId === project.id && workspace.targetId === kept.id,
      );

      if (user !== undefined)
        return failed(
          `${user.id} "${user.name}" tests on the ${kind} target of ${project.id}: delete that workspace first, or keep the target.`,
        );

      changes.push(`removed its ${kind} target`);
      continue;
    }

    const value = kind === 'web' ? webAddressOf(typed) : typed;

    if (value === null) return failed(`"${typed}" is not a web address.`);

    const label = port.targetLabel(kind);

    targets.push(
      kept === null ? { id: `t-${kind}`, kind, label, value } : { ...kept, label, value },
    );

    if (kept?.value !== value) changes.push(`set its ${kind} target to ${value}`);
  }

  if (targets.length === 0) return failed(NEEDS_TARGET);

  if (changes.length === 0)
    return {
      text: `Nothing changed on ${project.id}: it already reads that way.`,
      isError: false,
    };

  port.putProject({ ...project, name, targets });

  return { text: `Changed ${project.id}: ${changes.join(', ')}.`, isError: false };
}

async function linkRepository(props: {
  args: Extract<ProjectCall, { name: 'link_repository' }>['args'];
  port: IAppPort;
}): Promise<IToolDone> {
  const { args, port } = props;
  const found = findByRef({
    items: port.read().projects,
    ref: args.project,
    noun: 'project',
  });

  if (!found.isFound) return failed(found.text);

  const project = found.item;
  const wanted = repositoryOfName(args.repository);

  if (wanted === null)
    return failed(`"${args.repository}" is not a repository as owner/name.`);

  const already = project.repositories.find((repository) =>
    sameRepository({ repository, named: wanted }),
  );

  if (already !== undefined)
    return {
      text: `${already.owner}/${already.name} is already linked to ${project.id}.`,
      isError: false,
    };

  const read = await readable(port);

  if (!read.isOk) return failed(read.text);

  const repository = read.repositories.find((one) =>
    sameRepository({ repository: one, named: wanted }),
  );

  if (repository === undefined)
    return failed(
      `The QA cannot read ${args.repository} on GitHub, or it does not exist.`,
    );

  const base =
    args.base === undefined || args.base === '' ? repository.defaultBranch : args.base;

  if (base !== repository.defaultBranch) {
    const branches = await port.listBranches({
      owner: repository.owner,
      name: repository.name,
    });

    if (!branches.isListed)
      return failed(
        `GitHub did not list its branches: ${GITHUB_SAYS[branches.failure]}.`,
      );

    if (!branches.branches.some(({ name }) => name === base))
      return failed(`${repository.owner}/${repository.name} has no branch "${base}".`);
  }

  port.putProject({
    ...project,
    repositories: [
      ...project.repositories,
      { owner: repository.owner, name: repository.name, baseBranch: base },
    ],
  });

  return {
    text: `Linked ${repository.owner}/${repository.name} to ${project.id} "${project.name}", its changes measured against ${base}. /code in a workspace's chat plans from it now.`,
    isError: false,
  };
}

function unlinkRepository(props: {
  args: Extract<ProjectCall, { name: 'unlink_repository' }>['args'];
  port: IAppPort;
}): IToolDone {
  const { args, port } = props;
  const found = findByRef({
    items: port.read().projects,
    ref: args.project,
    noun: 'project',
  });

  if (!found.isFound) return failed(found.text);

  const project = found.item;
  const wanted = repositoryOfName(args.repository);
  const linked =
    wanted === null
      ? undefined
      : project.repositories.find((repository) =>
          sameRepository({ repository, named: wanted }),
        );

  if (linked === undefined)
    return failed(
      project.repositories.length === 0
        ? `${project.id} has no repository linked.`
        : `${project.id} has no repository "${args.repository}". It has ${project.repositories.map(({ owner, name }) => `${owner}/${name}`).join(', ')}.`,
    );

  port.putProject({
    ...project,
    repositories: project.repositories.filter((repository) => repository !== linked),
  });

  return {
    text: `Unlinked ${linked.owner}/${linked.name} from ${project.id} "${project.name}".`,
    isError: false,
  };
}

/** Creates or changes a project the way its settings would, and links or lists the QA's GitHub repositories. */
export async function performProjectChange(props: {
  call: ProjectCall;
  port: IAppPort;
}): Promise<IToolDone> {
  const { call, port } = props;

  if (call.name === 'list_repositories') return listRepositories(port);

  if (call.name === 'create_project') return createProject({ args: call.args, port });

  if (call.name === 'update_project') return updateProject({ args: call.args, port });

  if (call.name === 'link_repository') return linkRepository({ args: call.args, port });

  return unlinkRepository({ args: call.args, port });
}
