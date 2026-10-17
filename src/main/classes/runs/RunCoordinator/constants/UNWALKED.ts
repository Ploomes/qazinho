/** Why a step has no verdict of the agent's own. */
export const UNWALKED = {
  skipped: 'Skipped because the step before it did not hold up.',
  unreported: 'The agent ended its turn without reporting this step.',
} as const;
