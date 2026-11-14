import type { IBug, IBugReportWords } from '@/modules/Bug/types';
import type {
  BugReportBlock,
  IBugReport,
  INetworkEntry,
  ITemplate,
} from '@/shared/types';
import { BUG_REPORT } from '@/modules/Bug/constants';
import { fillValues, renderParts } from '@/modules/Template/library';

/**
 * Um bug escrito para o tracker do QA, no modelo do time ou no do QAzinho: o que o agente
 * viu, os passos, esperado e obtido, os pedidos.
 */
export function bugReportOf(props: {
  bug: IBug;
  title: string;
  app: string | null;
  story: { key: string; url: string } | null;
  design: { name: string; url: string } | null;
  requests: INetworkEntry[];
  attached: string[];
  words: IBugReportWords;
  template?: ITemplate | null;
}): IBugReport {
  const { bug, words } = props;
  const said = (text: string): BugReportBlock[] =>
    text.trim() === '' ? [] : [{ kind: 'paragraph', text: text.trim() }];

  const typed = props.title.trim() === '' ? bug.title : props.title.trim();
  const template = props.template ?? null;
  const values = {
    title: typed,
    case: bug.caseId,
    app: props.app ?? '',
    story: props.story?.key ?? '',
    run: bug.runId,
    step: String(bug.stepNumber),
  };
  const sections: Record<string, BugReportBlock[]> = {
    body: said(bug.body),
    steps:
      bug.repro.length === 0
        ? []
        : [
            {
              kind: 'steps',
              items: bug.repro.map((step) => ({ text: step.action, isBad: step.isBad })),
            },
          ],
    expected: said(bug.expected),
    got: said(bug.got),
    requests:
      props.requests.length === 0
        ? []
        : [
            {
              kind: 'requests',
              items: props.requests.map((request) => ({
                ...answerOf(request.body),
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
    where: [
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
          ...(props.design === null
            ? []
            : [{ label: words.design, value: props.design.name, url: props.design.url }]),
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
    ],
    attached: said(props.attached.length === 0 ? '' : words.attached(props.attached)),
    footer: [{ kind: 'paragraph', text: words.foundWith }],
  };

  return {
    title:
      template === null || template.title.trim() === ''
        ? typed
        : fillValues({ text: template.title, values }).trim() || typed,
    blocks: renderParts({
      parts: template?.parts ?? [
        { kind: 'section', field: 'body', heading: '' },
        { kind: 'section', field: 'steps', heading: words.steps },
        { kind: 'section', field: 'expected', heading: words.expected },
        { kind: 'section', field: 'got', heading: words.got },
        { kind: 'section', field: 'requests', heading: words.requests },
        { kind: 'section', field: 'where', heading: words.where },
        { kind: 'section', field: 'attached', heading: '' },
        { kind: 'section', field: 'footer', heading: '' },
      ],
      sections,
      values,
    }),
  };
}

function cut(text: string): string {
  return text.length > BUG_REPORT.urlLength
    ? `${text.slice(0, BUG_REPORT.urlLength - 1)}…`
    : text;
}

function answerOf(body: string | undefined): { answer?: string } {
  const said = body?.replace(/\s+/g, ' ').trim() ?? '';

  return said === ''
    ? {}
    : {
        answer:
          said.length > BUG_REPORT.answerLength
            ? `${said.slice(0, BUG_REPORT.answerLength - 1)}…`
            : said,
      };
}
