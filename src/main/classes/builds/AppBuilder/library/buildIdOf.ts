import { APP_BUILDER } from '@/main/classes/builds/AppBuilder/constants/APP_BUILDER';

/** The build an agent's events belong to, read off the scope it ran under; null for an agent that is not building. */
export function buildIdOf(scope: string): string | null {
  return scope.startsWith(APP_BUILDER.scopePrefix) &&
    scope.length > APP_BUILDER.scopePrefix.length
    ? scope.slice(APP_BUILDER.scopePrefix.length)
    : null;
}
