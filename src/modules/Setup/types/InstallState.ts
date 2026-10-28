import type { InstallFailure } from '@/shared/types';

/** Em que pé está uma instalação. Uma ferramenta sem estado nunca foi pedida. */
export type InstallState =
  | { phase: 'installing'; stage: number; stages: number; line: string }
  | { phase: 'installed' }
  | { phase: 'failed'; failure: InstallFailure; command: string; isFix: boolean };
