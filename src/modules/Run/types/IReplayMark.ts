import type { Severity } from '@/shared/types';

/** Um bug preso ao momento do vídeo em que foi pego. */
export interface IReplayMark {
  bugId: string;
  title: string;
  severity: Severity;
  atMs: number;
  caseId: string;
  stepNumber: number;
}
