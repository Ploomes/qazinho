import type { IConfluencePageRef } from '@/shared/types';

type Found = {
  content?: {
    id?: unknown;
    type?: unknown;
    title?: unknown;
    _links?: { webui?: unknown };
  };
  resultGlobalContainer?: { title?: unknown };
};

/** The pages a Confluence search answered with, each with its space and where it opens. */
export function confluencePagesOf(props: {
  answer: unknown;
  site: string;
}): IConfluencePageRef[] {
  const results = (props.answer as { results?: unknown } | null)?.results;

  return Array.isArray(results)
    ? (results as Found[]).flatMap(({ content, resultGlobalContainer }) =>
        typeof content?.id === 'string' &&
        typeof content.title === 'string' &&
        (content.type === undefined || content.type === 'page')
          ? [
              {
                id: content.id,
                title: content.title,
                space:
                  typeof resultGlobalContainer?.title === 'string'
                    ? resultGlobalContainer.title
                    : '',
                url:
                  typeof content._links?.webui === 'string'
                    ? `${props.site}/wiki${content._links.webui}`
                    : `${props.site}/wiki/pages/viewpage.action?pageId=${content.id}`,
              },
            ]
          : [],
      )
    : [];
}
