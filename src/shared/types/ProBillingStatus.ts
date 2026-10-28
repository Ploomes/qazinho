/**
 * Em que pé está o pagamento de uma org; um teste, um plano ativo ou um atraso recente
 * deixam os membros entrarem.
 */
export type ProBillingStatus =
  'trialing' | 'active' | 'past_due' | 'blocked' | 'canceled';
