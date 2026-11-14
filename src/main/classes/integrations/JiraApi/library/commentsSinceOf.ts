import { adfToMarkdown } from './adfToMarkdown';

type Loose = Record<string, unknown>;

/**
 * Os comentários de uma história escritos depois de um momento, menos os que o QAzinho
 * postou, os mais velhos primeiro.
 */
export function commentsSinceOf(props: {
  body: unknown;
  since: string;
  skip: string[];
}): { author: string; at: string; text: string }[] {
  const since = Date.parse(props.since);
  const comments = record(props.body).comments;

  return (Array.isArray(comments) ? comments : [])
    .map((value) => {
      const comment = record(value);
      const author = record(comment.author);

      return {
        id: typeof comment.id === 'string' ? comment.id : '',
        author: typeof author.displayName === 'string' ? author.displayName : '',
        at: typeof comment.created === 'string' ? comment.created : '',
        text: adfToMarkdown(comment.body).trim(),
      };
    })
    .filter(
      ({ id, at, text }) =>
        text !== '' && !props.skip.includes(id) && Date.parse(at) > since,
    )
    .sort((one, other) => Date.parse(one.at) - Date.parse(other.at))
    .map(({ author, at, text }) => ({ author, at, text }));
}

function record(value: unknown): Loose {
  return typeof value === 'object' && value !== null ? (value as Loose) : {};
}
