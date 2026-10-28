/**
 * Em que pé está a olhada num bug que voltou: o agente pesando, uma atualização esperando
 * pelo QA, nada novo para a issue, postando, postada, posta de lado, ou não feita.
 */
export type BugReviewState =
  | 'reviewing'
  | 'suggested'
  | 'nothing-new'
  | 'posting'
  | 'posted'
  | 'dismissed'
  | 'failed';
