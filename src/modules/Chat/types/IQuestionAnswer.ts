/** Como o QA respondeu uma pergunta do agente, ou a dúvida que ela virou na história. */
export interface IQuestionAnswer {
  picked: string[];
  text: string;
  kept?: string[];
  toStory?: boolean;
  doubtId?: string;
}
