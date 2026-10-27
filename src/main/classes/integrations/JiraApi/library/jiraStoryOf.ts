import type { IJiraStory } from '@/shared/types';
import { JIRA_READ } from '@/main/classes/integrations/JiraApi/constants';
import { adfToMarkdown } from './adfToMarkdown';

type Loose = Record<string, unknown>;

/**
 * The story out of Jira's answer for one issue asked with every field and their names, or
 * null when it is not an issue.
 */
export function jiraStoryOf(props: { issue: unknown; site: string }): IJiraStory | null {
  const issue = record(props.issue);
  const key = text(issue.key);

  if (key.length === 0) return null;

  const fields = record(issue.fields);
  const names = record(issue.names);

  return {
    key,
    url: `${props.site}/browse/${key}`,
    summary: text(fields.summary),
    type: named(fields.issuetype),
    status: named(fields.status),
    priority: named(fields.priority),
    labels: list(fields.labels)
      .map(text)
      .filter((label) => label.length > 0),
    components: list(fields.components)
      .map(named)
      .filter((name) => name.length > 0),
    parent: fields.parent === undefined ? '' : issueLine(fields.parent),
    description: adfToMarkdown(fields.description),
    acceptance: Object.entries(fields).flatMap(([id, value]) => {
      const field = text(names[id]);
      const said =
        id.startsWith('customfield_') && JIRA_READ.acceptanceField.test(field)
          ? fieldText(value)
          : '';

      return said.length === 0 ? [] : [{ field, text: said }];
    }),
    comments: list(record(fields.comment).comments)
      .slice(-JIRA_READ.comments)
      .map((comment) => ({
        author: text(record(record(comment).author).displayName),
        at: text(record(comment).created).slice(0, 10),
        text: adfToMarkdown(record(comment).body).slice(0, JIRA_READ.commentLength),
      }))
      .filter((comment) => comment.text.length > 0),
    links: list(fields.issuelinks).flatMap((link) => {
      const linked = record(link);
      const type = record(linked.type);
      const isOut = linked.outwardIssue !== undefined;
      const other = isOut ? linked.outwardIssue : linked.inwardIssue;
      const how = text(isOut ? type.outward : type.inward) || text(type.name);

      return other === undefined ? [] : [`${how} ${issueLine(other)}`.trim()];
    }),
    subtasks: list(fields.subtasks)
      .map(issueLine)
      .filter((line) => line.length > 0),
    attachments: list(fields.attachment).flatMap((attachment) => {
      const file = record(attachment);
      const id = typeof file.id === 'number' ? String(file.id) : text(file.id);

      return id.length === 0
        ? []
        : [
            {
              id,
              filename: text(file.filename) || id,
              mimeType: text(file.mimeType),
              size: typeof file.size === 'number' ? file.size : 0,
            },
          ];
    }),
  };
}

function record(value: unknown): Loose {
  return typeof value === 'object' && value !== null ? (value as Loose) : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function named(value: unknown): string {
  return text(record(value).name);
}

function issueLine(value: unknown): string {
  const issue = record(value);
  const summary = text(record(issue.fields).summary);

  return summary.length === 0 ? text(issue.key) : `${text(issue.key)} · ${summary}`;
}

function fieldText(value: unknown): string {
  if (Array.isArray(value))
    return value
      .map((item) =>
        typeof item === 'string' ? item : text(record(item).value) || named(item),
      )
      .filter((item) => item.length > 0)
      .map((item) => `- ${item}`)
      .join('\n');

  if (typeof value === 'object' && value !== null && 'type' in value)
    return adfToMarkdown(value);

  return text(value) || text(record(value).value);
}
