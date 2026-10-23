import type { IConfluencePage } from '@/shared/types';
import { describePage, renderSections } from '@/harness/context/library';

/** A page read by the agent's own call, in the very words /confluence hands it over. */
export function pageAnswerOf(page: IConfluencePage): string {
  return renderSections([describePage(page)]);
}
