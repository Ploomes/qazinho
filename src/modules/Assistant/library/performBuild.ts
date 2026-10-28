import type { IAppPort, IToolDone } from '@/modules/Assistant/types';
import type { IBuild } from '@/modules/Build/types';
import type { AppToolCall, BuildFailure } from '@/shared/types';
import { findByRef } from './findByRef';
import { repositoryOfName } from './repositoryOfName';

const WHAT = {
  android: 'an Android .apk',
  ios: 'an iOS .app for the simulator',
} as const;

/**
 * Inicia um build do app de um projeto a partir de um dos repositórios dele, ou diz como
 * os builds foram.
 */
export function performBuild(props: {
  call: Extract<AppToolCall, { name: 'build_app' | 'build_status' }>;
  port: IAppPort;
}): IToolDone {
  const { call, port } = props;
  const state = port.read();

  if (call.name === 'build_status') {
    const project =
      call.args.project === undefined
        ? null
        : findByRef({ items: state.projects, ref: call.args.project, noun: 'project' });

    if (project !== null && !project.isFound)
      return { text: project.text, isError: true };

    const builds = state.builds.filter(
      (build) => project === null || build.projectId === project.item.id,
    );

    return {
      text:
        builds.length === 0
          ? 'No build has started since QAzinho opened.'
          : ['The builds, newest first:', ...builds.map(lineOf)].join('\n'),
      isError: false,
    };
  }

  const found = findByRef({
    items: state.projects,
    ref: call.args.project,
    noun: 'project',
  });

  if (!found.isFound) return { text: found.text, isError: true };

  const project = found.item;
  const { platform } = call.args;
  const named =
    call.args.repository === undefined ? null : repositoryOfName(call.args.repository);
  const linked = project.repositories
    .map(({ owner, name }) => `${owner}/${name}`)
    .join(', ');
  const [only] = project.repositories;
  const repository =
    named === null
      ? project.repositories.length === 1
        ? only
        : undefined
      : project.repositories.find(
          ({ owner, name }) =>
            owner.toLowerCase() === named.owner.toLowerCase() &&
            name.toLowerCase() === named.name.toLowerCase(),
        );

  if (!state.integrations.some(({ id }) => id === 'github'))
    return {
      text: 'GitHub is not connected to QAzinho, so it cannot get the code: connect it first with connect_integration.',
      isError: true,
    };

  if (project.repositories.length === 0)
    return {
      text: `${project.id} names no repository to build from: link one first with link_repository.`,
      isError: true,
    };

  if (repository === undefined)
    return {
      text:
        call.args.repository === undefined
          ? `${project.id} is made of ${linked}: say which repository to build.`
          : `${project.id} has no repository "${call.args.repository}". It has ${linked}.`,
      isError: true,
    };

  if (platform === 'android' && !state.hasAndroidSdk)
    return {
      text: 'This machine has no Android SDK, which an Android build needs. Android Studio installs it.',
      isError: true,
    };

  if (platform === 'ios' && !state.hasXcode)
    return {
      text: 'This machine has no Xcode, which an iOS build needs.',
      isError: true,
    };

  const going = state.builds.find(
    (build) =>
      build.projectId === project.id &&
      build.platform === platform &&
      build.phase === 'working',
  );

  if (going !== undefined)
    return {
      text: `${project.id} is already building ${WHAT[platform]} (${going.id}): build_status says how it goes.`,
      isError: true,
    };

  const branch =
    call.args.branch === undefined || call.args.branch === ''
      ? repository.baseBranch
      : call.args.branch;
  const buildId = port.startBuild({
    projectId: project.id,
    platform,
    repository: { owner: repository.owner, name: repository.name },
    branch,
  });

  return {
    text: `Started building ${WHAT[platform]} of ${repository.owner}/${repository.name}, branch ${branch}, for ${project.id} "${project.name}" (${buildId}). It takes minutes and goes on by itself, and the QA follows it in this chat; once built, it becomes ${project.id}'s ${platform} target. build_status says how it goes.`,
    isError: false,
    buildId,
  };
}

function failureOf(failure: BuildFailure): string {
  switch (failure.reason) {
    case 'agent-missing':
      return `the agent ${failure.agentId} is not on this machine`;
    case 'code':
      return `GitHub did not hand over the code (${failure.failure})`;
    case 'agent':
      return 'said' in failure.failure
        ? `the agent stopped: ${failure.failure.said}`
        : `the agent stopped (${failure.failure.reason})`;
    case 'no-artifact':
      return failure.said === ''
        ? 'it made nothing QAzinho can run'
        : `it made nothing QAzinho can run: ${failure.said}`;
    case 'stopped':
      return 'the QA stopped it';
  }
}

function lineOf(build: IBuild): string {
  const head = `- ${build.id}: ${WHAT[build.platform]} of ${build.repository} (${build.branch})${build.projectId === null ? '' : ` for ${build.projectId}`}`;
  const result = build.result;

  if (result === null)
    return `${head}, going: ${build.step === 'code' ? 'getting the code' : build.step === 'agent' ? 'the agent is building it' : 'checking what it made'}${build.lines.length === 0 ? '' : `, last: ${build.lines.at(-1) ?? ''}`}`;

  return result.isBuilt
    ? `${head}, built: ${result.artifact.split('/').at(-1) ?? result.artifact}`
    : `${head}, made nothing: ${failureOf(result.failure)}`;
}
