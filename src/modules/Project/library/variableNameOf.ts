import { VARIABLE_NAME } from '@/shared/constants';

/**
 * Um nome como o QA o digita, feito nome de variável: letras maiúsculas sem acento,
 * dígitos, e _ para qualquer outra coisa.
 */
export function variableNameOf(typed: string): string {
  return typed
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9_]+/g, '_')
    .slice(0, VARIABLE_NAME.maxLength);
}
