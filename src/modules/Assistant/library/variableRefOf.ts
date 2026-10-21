import { variableNameOf } from '@/modules/Project/library';

/** A variable as the agent named it, with its ${ } or without, read as the variable's name. */
export function variableRefOf(ref: string): string {
  return variableNameOf(ref.trim().replace(/^\$\{/, '').replace(/\}$/, ''));
}
