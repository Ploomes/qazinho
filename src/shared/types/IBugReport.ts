import type { BugReportBlock } from './BugReportBlock';

/**
 * A bug written out for a tracker in the QA's language: its title, and its body as blocks
 * each tracker draws its own way.
 */
export interface IBugReport {
  title: string;
  blocks: BugReportBlock[];
}
