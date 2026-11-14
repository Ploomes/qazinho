import { adfToMarkdown } from './adfToMarkdown';

type Loose = Record<string, unknown>;

/**
 * Os comentários escritos ou editados numa história depois de um momento, os mais velhos
 * primeiro; um que o QAzinho postou só conta quando alguém o editou depois.
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

      const created = typeof comment.created === 'string' ? comment.created : '';
      const updated = typeof comment.updated === 'string' ? comment.updated : created;
      const isEdited = Date.parse(updated) > Date.parse(created);

      return {
        id: typeof comment.id === 'string' ? comment.id : '',
        author: typeof author.displayName === 'string' ? author.displayName : '',
        at: isEdited ? updated : created,
        isEdited,
        text: adfToMarkdown(comment.body).trim(),
      };
    })
    .filter(
      ({ id, at, isEdited, text }) =>
        text !== '' && (isEdited || !props.skip.includes(id)) && Date.parse(at) > since,
    )
    .sort((one, other) => Date.parse(one.at) - Date.parse(other.at))
    .map(({ author, at, text }) => ({ author, at, text }));
}

function record(value: unknown): Loose {
  return typeof value === 'object' && value !== null ? (value as Loose) : {};
}
