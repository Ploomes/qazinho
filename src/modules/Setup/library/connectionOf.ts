import type { IConnectIntegration, IntegrationId } from '@/types';

/** What the QA typed, shaped for the tracker it is for; null while a field it needs is still empty. */
export function connectionOf(props: {
  id: IntegrationId;
  values: Partial<Record<'site' | 'email' | 'token', string>>;
}): IConnectIntegration | null {
  const site = props.values.site?.trim() ?? '';
  const email = props.values.email?.trim() ?? '';
  const token = props.values.token?.trim() ?? '';

  if (token.length === 0) return null;
  if (props.id === 'github') return { id: 'github', token };
  if (site.length === 0 || email.length === 0) return null;

  return { id: 'jira', site, email, token };
}
