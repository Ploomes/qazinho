import { variableNameOf } from '@/modules/Project/library';

/**
 * Uma variável como o agente a nomeou, com o ${ } ou sem, lida como o nome da variável.
 */
export function variableRefOf(ref: string): string {
  return variableNameOf(ref.trim().replace(/^\$\{/, '').replace(/\}$/, ''));
}
