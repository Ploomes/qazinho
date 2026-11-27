import type { IRecipeBook } from '@/main/classes/runs/RunCoordinator/types';
import type { IStartRun } from '@/shared/types';
import { casesOf, recipeFor } from '@ploomes/qazinho-harness/engine';

/** Se a run vai ter o agente desenvolvendo algum caso, o que não vale gravar em vídeo. */
export function developsACase(props: {
  run: Pick<IStartRun, 'mode' | 'steps' | 'caseIds' | 'target'>;
  book: IRecipeBook;
}): boolean {
  const { run, book } = props;

  if (run.mode === 'explore') return false;

  if (run.mode === 'agent') return true;

  const wanted = run.caseIds === undefined ? null : new Set(run.caseIds);

  return casesOf(run.steps).some((steps) => {
    const flat = steps.map(({ step }) => step);
    const caseId = flat[0]?.caseId;

    return (
      caseId !== undefined &&
      flat[0]?.caseIsManual !== true &&
      (wanted === null || wanted.has(caseId)) &&
      recipeFor({ book, steps: flat, targetKind: run.target.kind }) === null
    );
  });
}
