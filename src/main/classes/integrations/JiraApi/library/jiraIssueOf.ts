import type { ITrackerIssue } from '@/shared/types';
import { JIRA_READ } from '@/main/classes/integrations/JiraApi/constants';
import { adfToMarkdown } from './adfToMarkdown';

type Loose = Record<string, unknown>;

/**
 * Uma issue registrada como o Jira a guarda agora: o resumo e a descrição, o status e se
 * está feita, e os últimos comentários do time; null para uma resposta que não é issue.
 */
export function jiraIssueOf(props: {
  issue: unknown;
  site: string;
}): ITrackerIssue | null {
  const issue = record(props.issue);
  const key = text(issue.key);
  const fields = record(issue.fields);
  const status = record(fields.status);
  const comments = record(fields.comment).comments;

  if (key === '') return null;

  return {
    key,
    title: text(fields.summary),
    url: `${props.site}/browse/${key}`,
    status: text(status.name),
    isClosed: text(record(status.statusCategory).key) === 'done',
    body: adfToMarkdown(fields.description),
    comments: (Array.isArray(comments) ? comments : [])
      .slice(-JIRA_READ.comments)
      .map((comment) => ({
        author: text(record(record(comment).author).displayName),
        at: text(record(comment).created).slice(0, 10),
        text: adfToMarkdown(record(comment).body).slice(0, JIRA_READ.commentLength),
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
