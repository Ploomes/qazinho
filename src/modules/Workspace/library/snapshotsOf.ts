import type { ISourceSnapshot } from '@/shared/types';

/** Os retratos das fontes que um arquivo salvo guarda, sem o que alguém quebrou à mão. */
export function snapshotsOf(saved: unknown): ISourceSnapshot[] {
  return (Array.isArray(saved) ? saved : []).flatMap((one): ISourceSnapshot[] => {
    const read = (one ?? {}) as Record<string, unknown>;
    const isText = (key: string) => typeof read[key] === 'string';

    if (!isText('text') || !isText('at') || !isText('url')) return [];

    if (read.kind === 'story' && isText('key'))
      return [
        {
          kind: 'story',
          key: read.key as string,
          url: read.url as string,
          text: read.text as string,
          at: read.at as string,
        },
      ];

    return read.kind === 'page' && isText('pageId') && isText('title')
      ? [
          {
            kind: 'page',
            pageId: read.pageId as string,
            title: read.title as string,
            url: read.url as string,
            text: read.text as string,
            at: read.at as string,
          },
        ]
      : [];
  });
}
