import type { ReactNode } from 'react';

/**
 * Uma conversa do agente de código do QA com o agente do chat, dobrada numa linha: com
 * quem, quantas mensagens e desde quando, e quando ele leu a resposta.
 */
export interface ITalkSectionProps {
  title: string;
  facts: string;
  receipt: string | null;
  isLive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}
