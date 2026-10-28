import { APP_BUILDER } from '@/main/classes/builds/AppBuilder/constants/APP_BUILDER';

/**
 * O build a que os eventos de um agente pertencem, lido do escopo sob o qual ele rodou;
 * null para um agente que não está construindo.
 */
export function buildIdOf(scope: string): string | null {
  return scope.startsWith(APP_BUILDER.scopePrefix) &&
    scope.length > APP_BUILDER.scopePrefix.length
    ? scope.slice(APP_BUILDER.scopePrefix.length)
    : null;
}
