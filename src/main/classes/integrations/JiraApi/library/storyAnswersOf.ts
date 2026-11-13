import type { IStoryAnswer, IStoryAnswersAsk } from '@/shared/types';
import { adfToMarkdown } from './adfToMarkdown';

type Loose = Record<string, unknown>;

interface IComment {
  id: string;
  authorId: string;
  author: string;
  at: string;
  text: string;
}

/**
 * As respostas que os comentários de uma história dão às dúvidas mandadas: um comentário
 * depois do do QA que nomeia a dúvida, ou o seguinte quando só uma espera.
 */
export function storyAnswersOf(props: {
  comments: unknown;
  doubts: IStoryAnswersAsk['doubts'];
  me: string;
}): IStoryAnswer[] {
  const posted = new Set(props.doubts.flatMap(({ sent }) => commentIdOf(sent.url) ?? []));
  const comments = list(record(props.comments).comments)
    .map(commentOf)
    .filter(
      (comment): comment is IComment =>
        comment !== null &&
        !posted.has(comment.id) &&
        comment.authorId !== props.me &&
        comment.text !== '',
    )
    .sort((one, other) => Date.parse(one.at) - Date.parse(other.at));
  const answers = new Map<string, IStoryAnswer>();

  for (const comment of comments) {
    const waiting = props.doubts.filter(
      ({ id, sent }) => !answers.has(id) && Date.parse(sent.at) < Date.parse(comment.at),
    );
    const named = namedIn(comment.text).filter(({ id }) =>
      waiting.some((doubt) => doubt.id === id),
    );
    const [only] = waiting;
    const said =
      named.length > 0
        ? named
        : waiting.length === 1 && only !== undefined
          ? [{ id: only.id, text: comment.text }]
          : [];

    for (const { id, text } of said)
      answers.set(id, { doubtId: id, text, by: comment.author, at: comment.at });
  }

  return props.doubts.flatMap(({ id }) => answers.get(id) ?? []);
}

function record(value: unknown): Loose {
  return typeof value === 'object' && value !== null ? (value as Loose) : {};
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function commentIdOf(url: string): string | null {
  return /[?&]focusedCommentId=(\d+)/.exec(url)?.[1] ?? null;
}

function commentOf(value: unknown): IComment | null {
  const comment = record(value);
  const author = record(comment.author);
  const id = typeof comment.id === 'number' ? String(comment.id) : text(comment.id);

  return id === ''
    ? null
    : {
        id,
        authorId: text(author.accountId),
        author: text(author.displayName),
        at: text(comment.created),
        text: adfToMarkdown(comment.body).trim(),
      };
}

function namedIn(said: string): { id: string; text: string }[] {
  const marks = [...said.matchAll(/\bD(\d+)\b/gi)];
  const own = marks.map((mark, index) =>
    said
      .slice((mark.index ?? 0) + mark[0].length, marks[index + 1]?.index ?? said.length)
      .replace(/^[\s:.)\-–—]+/, '')
      .trim(),
  );
  const texts = own.reduceRight<string[]>(
    (after, text) => [
      text === '' || /^(e|and|y|ou|or|&|,)$/i.test(text) ? (after[0] ?? said) : text,
      ...after,
    ],
    [],
  );

  return marks.map((mark, index) => ({
    id: `D${String(Number(mark[1]))}`,
    text: texts[index] ?? said,
  }));
}
