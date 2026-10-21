import type { AssistantSuggestion } from '@/modules/Assistant/types';

/** The first messages an empty chat offers: about the workspace on screen when there is one, a first project when there is none. */
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
