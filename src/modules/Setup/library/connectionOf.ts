import type { IConnectIntegration, IntegrationId } from '@/shared/types';

/** What connecting a tracker takes, from what the QA typed: nothing for GitHub; for Jira, null while a field is empty. */
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
