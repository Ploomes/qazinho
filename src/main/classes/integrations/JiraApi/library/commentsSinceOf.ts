import { adfToMarkdown } from './adfToMarkdown';

type Loose = Record<string, unknown>;

/**
 * Os comentários de uma história escritos depois de um momento por alguém que não o QA,
 * os mais velhos primeiro.
 */
export function commentsSinceOf(props: {
  body: unknown;
  since: string;
  me: string;
}): { author: string; at: string; text: string }[] {
  const since = Date.parse(props.since);
  const comments = record(props.body).comments;

  return (Array.isArray(comments) ? comments : [])
    .map((value) => {
      const comment = record(value);
      const author = record(comment.author);

      return {
        authorId: typeof author.accountId === 'string' ? author.accountId : '',
        author: typeof author.displayName === 'string' ? author.displayName : '',
        at: typeof comment.created === 'string' ? comment.created : '',
        text: adfToMarkdown(comment.body).trim(),
      };
    })
    .filter(
      ({ authorId, at, text }) =>
        text !== '' && authorId !== props.me && Date.parse(at) > since,
    )
    .sort((one, other) => Date.parse(one.at) - Date.parse(other.at))
    .map(({ author, at, text }) => ({ author, at, text }));
}

function record(value: unknown): Loose {
  return typeof value === 'object' && value !== null ? (value as Loose) : {};
}
