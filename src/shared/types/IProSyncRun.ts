import type { TargetKind } from './TargetKind';

/**
 * Uma run terminada como vai ao QAzinho Pro: os casos e passos com as telas que deixaram
 * como arquivos no archive; a main acha o vídeo dela.
 */
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
      by: 'agent' | 'replay' | 'healed' | 'qa';
      proof: string | null;
      span: { from: number; to: number } | null;
    }[];
  }[];
  videoStartedAt: string | null;
  costUsd: number | null;
}
