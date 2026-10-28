import type { BugReportBlock } from './BugReportBlock';

/**
 * Um plano a publicar no Confluence: a página que ele atualiza, ou o espaço e a página
 * pai sob a qual vai uma nova, o título e o conteúdo.
 */
export interface IPublishPlan {
  pageId: string | null;
  spaceId: string;
  parentId: string | null;
  title: string;
  blocks: BugReportBlock[];
}
