import type { IConfluencePageRef } from '@/shared/types';

/**
 * A página do Confluence em que um plano foi publicado, o espaço em que fica e a página
 * pai, para a próxima publicação atualizá-la.
 */
export interface IPublishedPlan {
  page: IConfluencePageRef;
  spaceId: string;
  parentId: string | null;
}
