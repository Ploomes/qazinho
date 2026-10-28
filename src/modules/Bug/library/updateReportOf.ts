import type { IBugSighting, IBugUpdateWords } from '@/modules/Bug/types';
import type { IBugReport, ReviewVerdict } from '@/shared/types';
import { blocksOfComment } from './blocksOfComment';

/**
 * A atualização postada sob a issue de um bug: que ele voltou depois de a issue ser
 * fechada, o comentário do QA, as runs que o pegaram de novo, e o que vai anexado.
 */
export function updateReportOf(props: {
  verdict: ReviewVerdict | null;
  comment: string;
  sightings: IBugSighting[];
  attached: string[];
  words: IBugUpdateWords;
}): IBugReport {
  const { words } = props;

  return {
    title: '',
    blocks: [
      ...(props.verdict === 'regression'
        ? [{ kind: 'paragraph' as const, text: words.regression }]
        : []),
      ...blocksOfComment(props.comment),
      ...(props.sightings.length === 0
        ? []
        : [
            { kind: 'paragraph' as const, text: words.seenAgain },
            {
              kind: 'list' as const,
              items: props.sightings.map((seen) =>
                words.runLine({
                  run: seen.runId,
                  when: seen.runWhen,
                  caseId: seen.caseId,
                  step: seen.stepNumber,
                }),
              ),
            },
          ]),
      ...(props.attached.length === 0
        ? []
        : [{ kind: 'paragraph' as const, text: words.attached(props.attached) }]),
    ],
  };
}
