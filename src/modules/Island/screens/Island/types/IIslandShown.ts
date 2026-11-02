import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { InternMood } from '@/shared/components/atoms/Intern/types';

/**
 * O que a ilha mostra: o Estagiário e o contador nas orelhas e, aberta, o título, o
 * estado, o detalhe, o progresso e os botões.
 */
export interface IIslandShown {
  count: string;
  mood: InternMood;
  icon: IconName;
  tone: 'running' | 'asking' | 'passed' | 'failed' | 'paused';
  title: string;
  line: string;
  detail: string;
  progress: number | null;
  canStop: boolean;
  openLabel: string;
  stopLabel: string;
}
