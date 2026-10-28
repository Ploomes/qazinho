import type { IConnectIntegration, IntegrationId } from '@/shared/types';

/**
 * O que conectar um tracker leva, a partir do que o QA digitou: nada para o GitHub; para
 * o Jira, null enquanto um campo está vazio.
 */
export function connectionOf(props: {
  id: IntegrationId;
  values: Partial<Record<'site' | 'email' | 'token', string>>;
}): IConnectIntegration | null {
  if (props.id === 'github') return { id: 'github' };

  const site = props.values.site?.trim() ?? '';
  const email = props.values.email?.trim() ?? '';
  const token = props.values.token?.trim() ?? '';

  if (site.length === 0 || email.length === 0 || token.length === 0) return null;

  return { id: 'jira', site, email, token };
}
