import type { IMcpServerStatus } from '@/shared/types';

/** Se este é o servidor das orgs, já conectado no agente do QA. */
export function isConnectedOrg({ id, state }: IMcpServerStatus): boolean {
  return id === 'org' && state === 'connected';
}
