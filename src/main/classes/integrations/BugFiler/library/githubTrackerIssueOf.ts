import type { ITrackerIssue } from '@/shared/types';

type Loose = Record<string, unknown>;

const COMMENTS = 10;

const COMMENT_LENGTH = 1_500;

/**
 * Uma issue do GitHub como o gh a respondeu, com os comentários sob ela, os últimos
 * mantidos; null para uma resposta que não é uma issue.
 */
export function githubTrackerIssueOf(props: {
  issue: string;
  comments: string;
}): ITrackerIssue | null {
  const issue = record(parsed(props.issue));
  const comments = parsed(props.comments);
  const number = issue.number;

  if (typeof number !== 'number') return null;

  return {
    key: `#${String(number)}`,
    title: text(issue.title),
    url: text(issue.html_url),
    status: text(issue.state),
    isClosed: issue.state === 'closed',
    body: text(issue.body),
    comments: (Array.isArray(comments) ? comments : [])
      .slice(-COMMENTS)
      .map((comment) => ({
        author: text(record(record(comment).user).login),
        at: text(record(comment).created_at).slice(0, 10),
        text: text(record(comment).body).slice(0, COMMENT_LENGTH),
      }))
      .filter((comment) => comment.text.length > 0),
  };
}

function record(value: unknown): Loose {
  return typeof value === 'object' && value !== null ? (value as Loose) : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parsed(said: string): unknown {
  try {
    return JSON.parse(said);
  } catch {
    return null;
  }
}
