import type { IAgentTurn } from '@/shared/types';

/** O que a sessão leu depois de um turno; nada quando ele resumiu a conversa. */
export function toldAfterTurn(props: {
  turn: IAgentTurn;
  told: Record<string, string>;
}): Record<string, string> {
  return props.turn.wasCompacted === true ? {} : props.told;
}
