import type { IProSyncRun } from '@/shared/types';

/** The run as the platform takes it, each screen and the video named by the key it was uploaded under; one that did not go up is null. */
export function runBodyOf(props: {
  run: IProSyncRun;
  videoFile: string | null;
  keys: Record<string, string>;
  machine: string;
}) {
  const { run, videoFile, keys, machine } = props;
  const keyOf = (file: string | null) => (file === null ? null : (keys[file] ?? null));

  return {
    kind: run.kind,
    startedAt: run.startedAt,
    durationSec: run.durationSec,
    endedBy: run.endedBy,
    target: run.target,
    counts: run.counts,
    cases: run.cases.map((runCase) => ({
      id: runCase.id,
      title: runCase.title,
      verdict: runCase.verdict,
      durationSec: runCase.durationSec,
      steps: runCase.steps.map(({ shotFile, ...step }) => ({
        ...step,
        shot: keyOf(shotFile),
      })),
    })),
    video: keyOf(videoFile),
    costUsd: run.costUsd,
    machine,
  };
}
