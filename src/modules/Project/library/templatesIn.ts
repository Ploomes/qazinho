import type { TemplateKind } from '@/shared/types';

const KINDS: TemplateKind[] = ['bug', 'plan', 'doubts', 'decisions'];

/** Os modelos que um projeto salvo escolheu, por tipo, ou null se nenhum. */
export function templatesIn(
  saved: unknown,
): Partial<Record<TemplateKind, string>> | null {
  if (typeof saved !== 'object' || saved === null) return null;

  const chosen = Object.fromEntries(
    KINDS.flatMap((kind) => {
      const id = (saved as Record<string, unknown>)[kind];

      return typeof id === 'string' && id !== '' ? [[kind, id]] : [];
    }),
  );

  return Object.keys(chosen).length === 0 ? null : chosen;
}
