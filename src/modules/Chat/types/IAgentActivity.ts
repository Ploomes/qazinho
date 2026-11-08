/** O que o agente acabou de fazer, para o chat contar enquanto ele trabalha. */
export interface IAgentActivity {
  id: number;
  tool: string;
  target: string;
}
