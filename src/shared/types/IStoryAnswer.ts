/** O que o time respondeu a uma dúvida na história, quem e quando. */
export interface IStoryAnswer {
  doubtId: string;
  text: string;
  by: string;
  at: string;
}
