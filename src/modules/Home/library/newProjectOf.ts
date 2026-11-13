import type {
  INewProject,
  INewProjectValues,
  NewProjectStart,
  ProjectPick,
} from '@/modules/Home/types';
import type { IProject, ITarget } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { TargetKind } from '@/shared/types';
import { newProjectId, webAddressOf } from '@/modules/Project/library';
import { blankWorkspaceOf } from '@/modules/Workspace/library';
import { planNameOf } from './planNameOf';

/**
 * O projeto que os cartões marcados criam: os alvos e o repositório, um plano por fonte
 * (a história, o design, os testes) ou um vazio, e como cada um começa.
 */
export function newProjectOf(props: {
  picks: ProjectPick[];
  values: INewProjectValues;
  name: string;
  now: number;
  labels: Record<TargetKind, string>;
}): INewProject {
  const { picks, values, now, labels } = props;
  const has = (pick: ProjectPick) => picks.includes(pick);
  const address = has('web') ? webAddressOf(values.web) : null;
  const targets: ITarget[] = [
    ...(address === null
      ? []
      : [{ id: 't-web', kind: 'web' as const, label: labels.web, value: address }]),
    ...(has('build')
      ? values.builds.map((build) => ({
          id: `t-${build.kind}`,
          kind: build.kind,
          label: labels[build.kind],
          value: build.path,
        }))
      : []),
  ];
  const project: IProject = {
    id: newProjectId(now),
    name: props.name.trim(),
    targets,
    repositories: has('code') ? values.repositories : [],
  };
  const sources = sourcesOf({ picks, values });
  const workspaces = (sources.length === 0 ? [{ name: '', start: null }] : sources).map(
    (source, index) => ({
      ...workspaceIn({ project, name: source.name, now: now + index }),
      ...source.extra,
    }),
  );
  const starts = sources.flatMap((source, index): NewProjectStart[] => {
    const workspaceId = workspaces[index]?.id ?? '';

    return source.start === null ? [] : [{ ...source.start, workspaceId }];
  });

  return { project, workspaces, openId: workspaces[0]?.id ?? '', starts };
}

type Source = {
  name: string;
  start: DistributiveOmit<NewProjectStart, 'workspaceId'> | null;
  extra?: Partial<IWorkspace>;
};

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

function sourcesOf(props: { picks: ProjectPick[]; values: INewProjectValues }): Source[] {
  const { picks, values } = props;
  const story = picks.includes('story') ? values.story : null;
  const design = picks.includes('design') ? values.design : null;
  const tests = picks.includes('tests') ? values.tests : null;
  const firsts: Source[] =
    story !== null
      ? [
          {
            name:
              story.kind === 'jira'
                ? planNameOf(story.issue.summary) || story.issue.key
                : planNameOf(story.page.title),
            start: { kind: 'story', story, design },
            extra: {
              issue:
                story.kind === 'jira'
                  ? {
                      key: story.issue.key,
                      title: story.issue.summary,
                      source: 'jira',
                      url: story.issue.url,
                    }
                  : null,
              design,
            },
          },
        ]
      : design !== null
        ? [{ name: design.name, start: { kind: 'design', design }, extra: { design } }]
        : [];

  return [
    ...firsts,
    ...(tests === null
      ? []
      : [{ name: tests.name, start: { kind: 'import' as const, source: tests } }]),
  ];
}

function workspaceIn(props: {
  project: IProject;
  name: string;
  now: number;
}): IWorkspace {
  const [target] = props.project.targets;
  const blank = blankWorkspaceOf({
    projectId: props.project.id,
    name: props.name,
    now: props.now,
  });

  return target === undefined
    ? blank
    : {
        ...blank,
        targetId: target.id,
        planKind: target.kind === 'web' ? 'web' : 'mobile',
      };
}
