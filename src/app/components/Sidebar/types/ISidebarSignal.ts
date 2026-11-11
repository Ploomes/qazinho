import type { IconName } from '@/shared/components/atoms/Icon/types';

/** O sinal desenhado na linha de um plano: o ícone, a cor, um número e o que ele diz. */
export interface ISidebarSignal {
  icon: IconName;
  tone: string;
  animation: string;
  count: string | null;
  label: string;
}
