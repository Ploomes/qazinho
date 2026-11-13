import type { IPlanDocWords, ITestCase } from '@/modules/Plan/types';
import type { IRun } from '@/modules/Run/types';
import type {
  BugReportBlock,
  IDesignLink,
  IPlanDoubt,
  IPlanStrategy,
} from '@/shared/types';
import { frameUrlOf } from './frameUrlOf';

/**
 * Um plano como uma página do Confluence: de onde veio, a estratégia e as dúvidas, depois
 * cada caso com os passos e os vereditos.
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

  return [
    { kind: 'paragraph', text: words.intro({ cases: plan.length, steps }) },
    ...(sources.length === 0 ? [] : [{ kind: 'facts' as const, items: sources }]),
    ...(parts.length === 0
      ? []
      : [
          { kind: 'heading' as const, text: words.strategy },
          { kind: 'facts' as const, items: parts },
        ]),
    ...(doubts.length === 0
      ? []
      : [
          { kind: 'heading' as const, text: words.doubts },
          {
            kind: 'table' as const,
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
        ]),
    ...plan.flatMap((testCase): BugReportBlock[] => {
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
                value: (testCase.sources ?? []).join(', '),
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
                    walked?.steps.find(({ number }) => number === index + 1)?.verdict ??
                    null;

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
    { kind: 'paragraph', text: words.keptBy },
  ];
}
