import type { IProject } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { ISprintStory } from '@/shared/types';
import { toPlanKind } from '@/modules/Plan/library';
import { blankWorkspaceOf } from '@/modules/Workspace/library';
import { planNameOf } from './planNameOf';

/** O workspace novo de uma história da sprint, com o nome dela, no alvo do projeto. */
export function sprintWorkspaceOf(props: {
  project: IProject;
  story: ISprintStory;
  now: number;
}): IWorkspace {
  const { project, story, now } = props;
  const [target] = project.targets;
  const name = planNameOf(story.title);

  return {
    ...blankWorkspaceOf({
      projectId: project.id,
      name: name === '' ? story.key : name,
      now,
    }),
    ...(target === undefined
      ? {}
      : { targetId: target.id, planKind: toPlanKind(target.kind) }),
    issue: { key: story.key, title: story.title, source: 'jira', url: story.url },
  };
}
