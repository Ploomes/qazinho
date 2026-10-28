import type { ProBillingStatus } from './ProBillingStatus';
import type { ProRole } from './ProRole';

/**
 * Uma org do QAzinho Pro a que a conta desta máquina pertence, o papel que ela tem lá, e
 * em que pé está o pagamento.
 */
export interface IProOrg {
  slug: string;
  name: string;
  role: ProRole;
  billingStatus: ProBillingStatus;
}
