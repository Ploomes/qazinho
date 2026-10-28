import type { IProSyncBug, IProSyncCatch } from '@/shared/types';

/**
 * O bug como a plataforma o aceita, cada tela (a da primeira vez em que foi pego e a de
 * cada vista) nomeada pela chave do upload; uma tela que não subiu fica de fora.
 */
export function bugBodyOf(props: { bug: IProSyncBug; keys: Record<string, string> }) {
  const { bug, keys } = props;
  const keyOf = (file: string | null) => (file === null ? null : (keys[file] ?? null));
  const catchOf = ({ shotFile, ...seen }: IProSyncCatch) => ({
    ...seen,
    shot: keyOf(shotFile),
  });

  return {
    severity: bug.severity,
    title: bug.title,
    body: bug.body,
    expected: bug.expected,
    got: bug.got,
    caseId: bug.caseId,
    caseTitle: bug.caseTitle,
    stepNumber: bug.stepNumber,
    target: bug.target,
    isIncidental: bug.isIncidental,
    isDismissed: bug.isDismissed,
    filed: bug.filed,
    repro: bug.repro,
    shots: bug.shots.flatMap(({ file, isBad }) => {
      const key = keyOf(file);

      return key === null ? [] : [{ key, isBad }];
    }),
    caught: bug.caught === null ? null : catchOf(bug.caught),
    sightings: bug.sightings.map(catchOf),
    firstSeenAt: bug.firstSeenAt,
  };
}
