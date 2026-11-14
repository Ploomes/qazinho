import type { IPlanDocWords, ITestCase } from '@/modules/Plan/types';
import type { IRun } from '@/modules/Run/types';
import type {
  BugReportBlock,
  IDesignLink,
  IPlanDoubt,
  IPlanStrategy,
  ITemplate,
} from '@/shared/types';
import { renderParts } from '@/modules/Template/library';
import { frameUrlOf } from './frameUrlOf';
import { gherkinOf } from './gherkinOf';

/**
 * Um plano como uma página do Confluence, no modelo do time ou no do QAzinho: de onde
 * veio, a estratégia, as dúvidas, e os casos em passos ou em Gherkin.
 */
export function planDocOf(props: {
  plan: ITestCase[];
  strategy?: IPlanStrategy | null;
  doubts?: IPlanDoubt[];
  run: IRun | null;
  when: string;
  story: { key: string; url: string } | null;
  page: { title: string; url: string } | null;
  design: IDesignLink | null;
  words: IPlanDocWords;
  name?: string;
  template?: ITemplate | null;
}): BugReportBlock[] {
  const { plan, run, words, design } = props;
  const steps = plan.reduce((total, testCase) => total + testCase.steps.length, 0);
  const hasFrames =
    design !== null &&
    plan.some((testCase) => testCase.steps.some(({ frame }) => frame !== undefined));
  const sources = [
    ...(props.story === null
      ? []
      : [{ label: words.story, value: props.story.key, url: props.story.url }]),
    ...(props.page === null
      ? []
      : [{ label: words.page, value: props.page.title, url: props.page.url }]),
    ...(design === null
      ? []
      : [{ label: words.design, value: design.name, url: design.url }]),
    ...(run === null
      ? []
      : [
          {
            label: words.lastRun,
            value: words.runLine({ run: run.id, when: props.when }),
            url: null,
          },
        ]),
  ];

  const strategy = props.strategy ?? null;
  const parts =
    strategy === null
      ? []
      : (Object.keys(words.strategyParts) as (keyof IPlanStrategy)[]).flatMap((part) =>
          strategy[part].trim() === ''
            ? []
            : [
                {
                  label: words.strategyParts[part],
                  value: strategy[part].trim(),
                  url: null,
                },
              ],
        );
  const doubts = props.doubts ?? [];

  const template = props.template ?? null;
  const values = {
    plan: props.name ?? '',
    story: props.story?.key ?? '',
    cases: String(plan.length),
    date: props.when,
  };
  const sections: Record<string, BugReportBlock[]> = {
    intro: [{ kind: 'paragraph', text: words.intro({ cases: plan.length, steps }) }],
    sources: sources.length === 0 ? [] : [{ kind: 'facts', items: sources }],
    strategy: parts.length === 0 ? [] : [{ kind: 'facts', items: parts }],
    doubts:
      doubts.length === 0
        ? []
        : [
            {
              kind: 'table',
              head: ['#', words.doubt, words.answer],
              rows: doubts.map(({ id, question, sent, answer }) => [
                id,
                question,
                answer !== null
                  ? `${answer.text} (${answer.by})`
                  : sent === null
                    ? words.doubtNotSent
                    : words.doubtWaiting,
              ]),
            },
          ],
    cases:
      template?.cases === 'gherkin'
        ? [
            {
              kind: 'code',
              text: gherkinOf({ name: props.name ?? '', plan, words: words.gherkin }),
            },
          ]
        : plan.flatMap((testCase): BugReportBlock[] => {
            const walked = run?.cases.find(({ id }) => id === testCase.id) ?? null;
            const facts = [
              { label: words.priority, value: testCase.priority, url: null },
              ...(testCase.goal.trim() === ''
                ? []
                : [{ label: words.goal, value: testCase.goal.trim(), url: null }]),
              ...(testCase.preconditions.trim() === ''
                ? []
                : [
                    {
                      label: words.preconditions,
                      value: testCase.preconditions.trim(),
                      url: null,
                    },
                  ]),
              ...((testCase.sources ?? []).length === 0
                ? []
                : [
                    {
                      label: words.sources,
                      value: (testCase.sources ?? []).map(words.source).join(', '),
                      url: null,
                    },
                  ]),
              ...((testCase.blockedBy ?? []).length === 0
                ? []
                : [
                    {
                      label: words.waitsOn,
                      value: (testCase.blockedBy ?? []).join(', '),
                      url: null,
                    },
                  ]),
            ];

            return [
              { kind: 'heading', text: `${testCase.id} ${testCase.title}` },
              { kind: 'facts', items: facts },
              ...(testCase.steps.length === 0
                ? []
                : [
                    {
                      kind: 'table' as const,
                      head: [
                        '#',
                        words.action,
                        words.expected,
                        ...(hasFrames ? [words.frame] : []),
                        ...(walked === null ? [] : [words.result]),
                      ],
                      rows: testCase.steps.map((step, index) => {
                        const verdict =
                          walked?.steps.find(({ number }) => number === index + 1)
                            ?.verdict ?? null;

                        return [
                          String(index + 1),
                          step.action,
                          step.expected,
                          ...(hasFrames && design !== null
                            ? [
                                step.frame === undefined
                                  ? ''
                                  : frameUrlOf({ design, frame: step.frame }),
                              ]
                            : []),
                          ...(walked === null
                            ? []
                            : [verdict === null ? '' : words.verdicts[verdict]]),
                        ];
                      }),
                    },
                  ]),
            ];
          }),
    footer: [{ kind: 'paragraph', text: words.keptBy }],
  };

  return renderParts({
    parts: template?.parts ?? [
      { kind: 'section', field: 'intro', heading: '' },
      { kind: 'section', field: 'sources', heading: '' },
      { kind: 'section', field: 'strategy', heading: words.strategy },
      { kind: 'section', field: 'doubts', heading: words.doubts },
      { kind: 'section', field: 'cases', heading: '' },
      { kind: 'section', field: 'footer', heading: '' },
    ],
    sections,
    values,
  });
}
