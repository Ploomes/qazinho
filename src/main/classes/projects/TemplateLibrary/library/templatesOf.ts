import type { ITemplate, TemplatePart } from '@/shared/types';

const KINDS = ['bug', 'plan', 'doubts', 'decisions'];

/** Os modelos que o arquivo guarda, sem o que alguém quebrou à mão. */
export function templatesOf(json: string): ITemplate[] {
  let read: unknown;

  try {
    read = JSON.parse(json);
  } catch {
    return [];
  }

  return (Array.isArray(read) ? read : []).flatMap((value): ITemplate[] => {
    const one = (value ?? {}) as Record<string, unknown>;

    if (
      typeof one.id !== 'string' ||
      typeof one.name !== 'string' ||
      !KINDS.includes(String(one.kind)) ||
      !Array.isArray(one.parts)
    )
      return [];

    return [
      {
        id: one.id,
        kind: one.kind as ITemplate['kind'],
        name: one.name,
        title: typeof one.title === 'string' ? one.title : '',
        parts: one.parts.flatMap(partOf),
        cases: one.cases === 'gherkin' ? 'gherkin' : 'steps',
        updatedAt: typeof one.updatedAt === 'string' ? one.updatedAt : '',
      },
    ];
  });
}

function partOf(value: unknown): TemplatePart[] {
  const part = (value ?? {}) as Record<string, unknown>;

  if (part.kind === 'text' && typeof part.text === 'string')
    return [{ kind: 'text', text: part.text }];

  return part.kind === 'section' &&
    typeof part.field === 'string' &&
    typeof part.heading === 'string'
    ? [{ kind: 'section', field: part.field, heading: part.heading }]
    : [];
}
