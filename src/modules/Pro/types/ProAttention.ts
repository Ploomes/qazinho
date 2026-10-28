/**
 * O que o QA deve saber dos projetos ligados dele: nenhuma resposta, nenhuma org, só
 * leitura, bloqueada, recusada, apagado na org, ou uma org fora de alcance.
 */
export type ProAttention =
  | 'unreachable'
  | 'no-org'
  | 'reader'
  | 'blocked'
  | 'read-only'
  | 'signed-out'
  | 'gone'
  | 'no-access'
  | 'failed';
