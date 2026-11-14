/** As dúvidas mandadas a uma história cujas respostas o QA quer ler, com onde foram. */
export interface IStoryAnswersAsk {
  key: string;
  doubts: { id: string; sent: { url: string; at: string } }[];
}
