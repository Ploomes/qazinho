import { ASSISTANT_TIP } from '@/modules/Assistant/components/AssistantTip/constants';

/** Por quanto tempo um balão fica na tela: o que dá para ler o texto dele sem pressa. */
export function holdMsOf(text: string): number {
  const reading = text.length * ASSISTANT_TIP.holdPerCharMs;

  return Math.min(ASSISTANT_TIP.maxHoldMs, Math.max(ASSISTANT_TIP.minHoldMs, reading));
}
