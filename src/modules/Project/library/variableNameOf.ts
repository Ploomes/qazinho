import { VARIABLE_NAME } from '@/shared/constants';

/**
 * A name as the QA types it, made a variable's name: capital letters without accents,
 * digits, and _ for anything else.
 */
export function variableNameOf(typed: string): string {
  return typed
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9_]+/g, '_')
    .slice(0, VARIABLE_NAME.maxLength);
}
