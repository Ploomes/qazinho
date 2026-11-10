import type { IRun, IRunStep } from '@/modules/Run/types';
import { caseVerdict } from '@/modules/Run/library/caseVerdict';

type Glance = {
  shot: {
    src: string | null;
    file: string | null;
    caseId: string;
    number: number;
  } | null;
  failed: { id: string; title: string; bugId: string | null }[];
};

/**
 * A tela do último passo que falhou numa run, senão a última tela dela, e os casos que
 * não passaram, cada um com o bug dele.
 */
export function lastRunGlanceOf(run: IRun): Glance {
  const steps = run.cases.flatMap((runCase) =>
    runCase.steps.map((step) => ({ caseId: runCase.id, step })),
  );
  const withShot = steps.filter(({ step }) => hasShot(step));
  const picked = withShot.findLast(({ step }) => isBad(step)) ?? withShot.at(-1) ?? null;

  return {
    shot:
      picked === null
        ? null
        : {
            src: picked.step.shot,
            file: picked.step.shotFile,
            caseId: picked.caseId,
            number: picked.step.number,
          },
    failed: run.cases
      .filter(({ steps: caseSteps }) => {
        const verdict = caseVerdict(caseSteps);

        return verdict === 'failed' || verdict === 'blocked';
      })
      .map((runCase) => ({
        id: runCase.id,
        title: runCase.title,
        bugId: runCase.steps.find(({ bugId }) => bugId !== null)?.bugId ?? null,
      })),
  };
}

function hasShot(step: IRunStep): boolean {
  return step.shot !== null || step.shotFile !== null;
}

function isBad(step: IRunStep): boolean {
  return step.verdict === 'failed' || step.verdict === 'blocked';
}
