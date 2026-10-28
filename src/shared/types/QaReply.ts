/**
 * A resposta do QA à pergunta de uma run: as palavras dele, ou um segredo que o agente
 * digita pelo nome, guardado nas variáveis do projeto quando ele diz.
 */
export type QaReply =
  { kind: 'said'; text: string } | { kind: 'secret'; value: string; isKept: boolean };
