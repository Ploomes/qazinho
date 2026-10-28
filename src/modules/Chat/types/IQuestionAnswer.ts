/**
 * Como o QA respondeu uma das perguntas do agente: as opções que escolheu, o que
 * escreveu, e as variáveis que uma opção o fez guardar.
 */
export interface IQuestionAnswer {
  picked: string[];
  text: string;
  kept?: string[];
}
