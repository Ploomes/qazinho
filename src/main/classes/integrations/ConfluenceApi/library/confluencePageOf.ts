import type { IConfluencePageRef } from '@/shared/types';
import { adfToMarkdown } from '@/main/classes/integrations/JiraApi/library';

type Page = {
  id?: unknown;
  title?: unknown;
  version?: { number?: unknown };
  spaceId?: unknown;
  body?: { atlas_doc_format?: { value?: unknown } };
  _links?: { webui?: unknown };
};

function documentOf(value: unknown): unknown {
  if (typeof value !== 'string') return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** A Confluence page as its API answers it: where it opens, its version and space, and its body as Markdown; null for an answer that is not a page. */
export function confluencePageOf(props: { answer: unknown; site: string }): {
  page: IConfluencePageRef;
  version: number;
  spaceId: string;
  text: string;
} | null {
  const read = (props.answer ?? {}) as Page;

  if (typeof read.id !== 'string' || typeof read.title !== 'string') return null;

  return {
    page: {
      id: read.id,
      title: read.title,
      space: '',
      url:
        typeof read._links?.webui === 'string'
          ? `${props.site}/wiki${read._links.webui}`
          : `${props.site}/wiki/pages/viewpage.action?pageId=${read.id}`,
    },
    version: typeof read.version?.number === 'number' ? read.version.number : 1,
    spaceId: typeof read.spaceId === 'string' ? read.spaceId : '',
    text: adfToMarkdown(documentOf(read.body?.atlas_doc_format?.value)),
  };
}
