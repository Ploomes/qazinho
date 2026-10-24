/** Where an org's payment stands; a trial, an active plan or a recent late payment let its members in. */
export type ProBillingStatus =
  'trialing' | 'active' | 'past_due' | 'blocked' | 'canceled';
