import type { IConfluencePageRef } from '@/shared/types';

/** The Confluence page a plan was published on, the space it sits in and its parent page, so the next publish updates it. */
export interface IPublishedPlan {
  page: IConfluencePageRef;
  spaceId: string;
  parentId: string | null;
}
