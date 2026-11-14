/** Uma skill do time que o QA chamou pelo nome, para o agente seguir nesta mensagem. */
export interface ISkillCommand {
  id: 'skill';
  skillId: string;
  name: string;
}
