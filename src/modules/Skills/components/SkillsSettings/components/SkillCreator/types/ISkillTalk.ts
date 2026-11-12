/** Uma fala na conversa em que o agente escreve uma skill com o QA. */
export interface ISkillTalk {
  id: string;
  from: 'qa' | 'agent';
  text: string;
}
