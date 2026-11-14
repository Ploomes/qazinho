/** As skills do time que o agente recebeu num turno do chat, numa linha baixa. */
export interface ISkillsMessage {
  id: string;
  kind: 'skills';
  at: string;
  names: string[];
}
