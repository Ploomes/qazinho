import type { BugReportBlock } from './BugReportBlock';

/**
 * A plan to publish in Confluence: the page it updates, or the space and parent page a
 * new one goes under, its title and its content.
 */
export interface IPublishPlan {
  pageId: string | null;
  spaceId: string;
  parentId: string | null;
  title: string;
  blocks: BugReportBlock[];
}
