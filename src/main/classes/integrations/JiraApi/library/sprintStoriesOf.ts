import type { ISprintStory } from '@/shared/types';

type Loose = Record<string, unknown>;

/** As histórias de uma sprint como a API ágil as lista, sem subtarefas nem épicos. */
export function sprintStoriesOf(props: { body: unknown; site: string }): ISprintStory[] {
  const { issues } = record(props.body);

  return (Array.isArray(issues) ? issues : []).flatMap((issue): ISprintStory[] => {
    const key = text(record(issue).key);
    const fields = record(record(issue).fields);
    const type = record(fields.issuetype);
    const level = type.hierarchyLevel;
    const isStory = typeof level === 'number' ? level === 0 : type.subtask !== true;

    if (key === '' || !isStory) return [];

    return [
      {
        key,
        title: text(fields.summary),
        status: text(record(fields.status).name),
        url: `${props.site}/browse/${key}`,
      },
    ];
  });
}

function record(value: unknown): Loose {
  return typeof value === 'object' && value !== null ? (value as Loose) : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
