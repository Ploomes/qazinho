/**
 * Uma parte de um modelo, na ordem em que sai: uma seção do que o QAzinho monta, com o
 * título que o time usa, ou um texto fixo com campos como {{app}}.
 */
export type TemplatePart =
  { kind: 'section'; field: string; heading: string } | { kind: 'text'; text: string };
