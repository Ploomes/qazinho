/**
 * As dúvidas que o QA leva a uma história num comentário: a abertura, cada dúvida pelo
 * id, o fecho que pede a resposta pelo id, e se ele passa a acompanhar a história.
 */
export interface IStoryDoubtsPost {
  key: string;
  intro: string;
  doubts: { id: string; question: string }[];
  closing: string;
  isWatching: boolean;
}
