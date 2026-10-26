import type { TargetKind } from './TargetKind';

/** A finished run as it goes to QAzinho Pro: its cases and steps with the screens they left as files in the archive; main finds its video. */
export interface IProSyncRun {
  workspaceId: string;
  runId: string;
  kind: 'run' | 'explore';
  startedAt: string;
  durationSec: number;
  endedBy: 'finished' | 'stopped' | 'broke' | 'interrupted';
  target: { kind: TargetKind; label: string; value: string };
  counts: { passed: number; failed: number; blocked: number; skipped: number };
  cases: {
    id: string;
    title: string;
    verdict: 'passed' | 'failed' | 'blocked' | 'skipped';
    durationSec: number;
    steps: {
      number: number;
      action: string;
      verdict: 'passed' | 'failed' | 'blocked' | 'skipped';
      why: string | null;
      bugId: string | null;
      shotFile: string | null;
      by: 'agent' | 'replay' | 'healed';
      proof: string | null;
      span: { from: number; to: number } | null;
    }[];
  }[];
  videoStartedAt: string | null;
  costUsd: number | null;
}
