import type { ProBillingStatus } from './ProBillingStatus';
import type { ProRole } from './ProRole';

/**
 * An org of QAzinho Pro this machine's account belongs to, the role it holds there, and
 * where its payment stands.
 */
export interface IProOrg {
  slug: string;
  name: string;
  role: ProRole;
  billingStatus: ProBillingStatus;
}
