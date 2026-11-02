import type { IconName } from '@/shared/components/atoms/Icon/types';

/**
 * O que a ilha mostra de uma vez: a orelha de cada lado do notch e, aberta, o título, a
 * linha de estado, o detalhe, o progresso e os botões.
 */
export interface IIslandShown {
  left: string;
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
