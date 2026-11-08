import type { RunHow } from '@/shared/types';

/** Quanto do plano está desenvolvido, e como a run em andamento o anda agora. */
export interface IPlanStagesProps {
  total: number;
  developed: number;
  how: RunHow | null;
}
