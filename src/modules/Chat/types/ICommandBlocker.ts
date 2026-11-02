import type { ParseKeys } from 'i18next';

/**
 * O que falta para um comando rodar: o que a linha dele diz, o que o Estagiário diz, e
 * onde se resolve.
 */
export interface ICommandBlocker {
  detailKey: ParseKeys;
  tipKey: ParseKeys;
  place: 'integrations' | 'project-code';
}
