import { TRACKER_ERRORS } from '@/main/classes/integrations/IntegrationVault/constants';

/** Why a tracker's answer is not a yes, or null when it is one. No answer at all means it was unreachable. */
export function trackerRefusal(
  answer: { ok: boolean; status: number } | null,
): string | null {
  if (answer === null) return TRACKER_ERRORS.unreachable;
  if (answer.ok) return null;
  if (answer.status === 401 || answer.status === 403) return TRACKER_ERRORS.unauthorized;

  return TRACKER_ERRORS.unexpected.replace('{status}', String(answer.status));
}
