import type { IBug } from '@/modules/Bug/types';
import type { IRun } from '@/modules/Run/types';
import type { BugVideo } from '@/shared/types';
import { clipOfMp4 } from './clipOfMp4';
import { replayTimelineOf } from './replayTimelineOf';
import { takeOf } from './takeOf';

/** The video that goes with a bug caught in a run, and where the bug sits in it: a clip of its moment cut from the run's MP4, else the run's whole recording; null for a run with no recording. */
export function bugVideoOf(props: {
  workspaceId: string;
  run: IRun;
  bug: IBug;
  recording: Uint8Array | null;
  clipName: string;
  recordingName: string;
}): { video: BugVideo; atMs: number } | null {
  const { run, bug, recording } = props;
  const timeline = replayTimelineOf({ run, bugs: [bug] });

  if (timeline === null) return null;

  const atMs = timeline.marks.find(({ bugId }) => bugId === bug.id)?.atMs ?? 0;
  const span = takeOf({ timeline, focus: { kind: 'bug', bugId: bug.id } });
  const clip =
    recording === null || span === null ? null : clipOfMp4({ video: recording, ...span });

  return {
    atMs,
    video:
      clip === null
        ? {
            kind: 'recording',
            name: props.recordingName,
            run: { workspaceId: props.workspaceId, runId: run.id },
          }
        : { kind: 'clip', name: props.clipName, data: clip },
  };
}
