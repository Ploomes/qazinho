/**
 * Como a pergunta de uma run terminou, como a página sabe: as palavras do QA, um segredo
 * pelo nome e se o projeto o guarda, sem resposta a tempo, ou a run parada antes.
 */
export type RunAnswer =
  | { kind: 'said'; text: string }
  | { kind: 'secret'; name: string; isKept: boolean }
  | { kind: 'unanswered' }
  | { kind: 'stopped' };
