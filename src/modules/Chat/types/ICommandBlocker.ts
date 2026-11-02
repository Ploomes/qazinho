import type { ParseKeys } from 'i18next';

/**
 * O que falta para um comando rodar: o que o Estagiário diz, e
 * onde se resolve.
 */
export interface ICommandBlocker {
  tipKey: ParseKeys;
  place: 'integrations' | 'project-code';
}
