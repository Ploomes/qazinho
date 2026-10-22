import type { IBug, IBugReportWords } from '@/modules/Bug/types';
import type { BugReportBlock, IBugReport, INetworkEntry } from '@/shared/types';
import { BUG_REPORT } from '@/modules/Bug/constants';

function cut(text: string): string {
  return text.length > BUG_REPORT.urlLength
    ? `${text.slice(0, BUG_REPORT.urlLength - 1)}…`
    : text;
}

/** A bug written out for the QA's tracker: what the agent saw, how to get there, what was expected and what came, the requests that failed around it, and where it was caught. */
export function bugReportOf(props: {
  bug: IBug;
  title: string;
  app: string | null;
  story: { key: string; url: string } | null;
  requests: INetworkEntry[];
  attached: string[];
  words: IBugReportWords;
}): IBugReport {
  const { bug, words } = props;
  const section = (heading: string, blocks: BugReportBlock[]): BugReportBlock[] =>
    blocks.length === 0 ? [] : [{ kind: 'heading', text: heading }, ...blocks];
  const said = (text: string): BugReportBlock[] =>
    text.trim() === '' ? [] : [{ kind: 'paragraph', text: text.trim() }];

  return {
    title: props.title.trim() === '' ? bug.title : props.title.trim(),
    blocks: [
      ...said(bug.body),
      ...section(
        words.steps,
        bug.repro.length === 0
          ? []
          : [
              {
                kind: 'steps',
                items: bug.repro.map((step) => ({
                  text: step.action,
                  isBad: step.isBad,
                })),
              },
            ],
      ),
      ...section(words.expected, said(bug.expected)),
      ...section(words.got, said(bug.got)),
      ...section(
        words.requests,
        props.requests.length === 0
          ? []
          : [
              {
                kind: 'requests',
                items: props.requests.map((request) => ({
                  call: `${request.method} ${cut(request.url)}`,
                  outcome: [
                    request.status ?? request.failure ?? words.noAnswer,
                    ...(request.durationMs === null
                      ? []
                      : [`${String(Math.round(request.durationMs))} ms`]),
                  ].join(' · '),
                })),
              },
            ],
      ),
      ...section(words.where, [
        {
          kind: 'facts',
          items: [
            ...(props.app === null
              ? []
              : [{ label: words.app, value: props.app, url: props.app }]),
            { label: words.target, value: bug.target, url: null },
            {
              label: words.run,
              value: words.runLine({
                run: bug.runId,
                when: bug.runWhen,
                caseId: bug.caseId,
                step: bug.stepNumber,
              }),
              url: null,
            },
            { label: words.seen, value: words.seenRuns(bug.seenRuns), url: null },
            ...(props.story === null
              ? []
              : [{ label: words.story, value: props.story.key, url: props.story.url }]),
            ...(bug.agent === ''
              ? []
              : [
                  {
                    label: words.caughtBy,
                    value: words.agentLine({ agent: bug.agent, model: bug.modelName }),
                    url: null,
                  },
                ]),
          ],
        },
      ]),
      ...said(props.attached.length === 0 ? '' : words.attached(props.attached)),
      { kind: 'paragraph', text: words.foundWith },
    ],
  };
}
