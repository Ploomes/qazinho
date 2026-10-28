import type { AssistantSuggestion } from '@/modules/Assistant/types';

/**
 * As primeiras mensagens que um chat vazio oferece: sobre o workspace na tela quando há
 * um, um primeiro projeto quando não há.
 */
export function suggestionsFor(props: {
  hasProjects: boolean;
  openRuns: number | null;
}): AssistantSuggestion[] {
  const { hasProjects, openRuns } = props;

  return [
    'abilities' as const,
    ...(openRuns !== null && openRuns > 0 ? (['lastRun'] as const) : []),
    ...(openRuns !== null ? (['summary', 'explore'] as const) : []),
    hasProjects ? ('newWorkspace' as const) : ('firstProject' as const),
    'theme' as const,
  ].slice(0, 4);
}
