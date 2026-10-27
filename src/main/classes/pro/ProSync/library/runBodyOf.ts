import type { IProSyncRun } from '@/shared/types';

/**
 * The run as the platform takes it, each screen, the video and the requests named by the
 * key they were uploaded under; one that did not go up is null.
 */
export function runBodyOf(props: {
  run: IProSyncRun;
  videoFile: string | null;
  networkFile: string | null;
  keys: Record<string, string>;
  machine: string;
}) {
  const { run, videoFile, networkFile, keys, machine } = props;
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
    videoStartedAt: run.videoStartedAt,
    network: keyOf(networkFile),
    costUsd: run.costUsd,
    machine,
  };
}
