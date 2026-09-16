import type { BugFilter } from '@/modules/Bug/types';

/** Severity is how a QA triages, so it is what the list filters by. */
export const BUG_FILTERS: BugFilter[] = ['all', 'high', 'medium', 'low'];
