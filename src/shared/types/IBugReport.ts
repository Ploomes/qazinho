import type { BugReportBlock } from './BugReportBlock';

/**
 * Um bug escrito para um tracker no idioma do QA: o título, e o corpo como blocos que
 * cada tracker desenha do seu jeito.
 */
export interface IBugReport {
  title: string;
  blocks: BugReportBlock[];
}
