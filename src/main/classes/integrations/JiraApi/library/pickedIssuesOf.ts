import type { IJiraIssueRef } from '@/shared/types';

/** The issues of Jira's picker answer, each once, in the order it suggests them: the ones the QA saw last, then the ones that match. */
export function pickedIssuesOf(props: {
  answer: unknown;
  site: string;
}): IJiraIssueRef[] {
  const sections = (props.answer as { sections?: unknown } | null)?.sections;
  const seen = new Set<string>();

  return (Array.isArray(sections) ? sections : []).flatMap((section) => {
    const issues = (section as { issues?: unknown } | null)?.issues;

    return (Array.isArray(issues) ? issues : []).flatMap((issue) => {
      const { key, summaryText, summary } = (issue ?? {}) as Record<string, unknown>;

      if (typeof key !== 'string' || key.length === 0 || seen.has(key)) return [];

      seen.add(key);

      return [
        {
          key,
          summary:
            typeof summaryText === 'string'
              ? summaryText
              : typeof summary === 'string'
                ? summary.replace(/<[^>]*>/g, '')
                : '',
          url: `${props.site}/browse/${key}`,
        },
      ];
    });
  });
}
