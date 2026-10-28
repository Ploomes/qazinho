import type { ParseKeys } from 'i18next';

/**
 * O que impede um conjunto de variáveis de ser salvo, como as palavras que o QA lê e o
 * nome de que tratam.
 */
export type VariableProblem = { key: ParseKeys; name: string } | null;
