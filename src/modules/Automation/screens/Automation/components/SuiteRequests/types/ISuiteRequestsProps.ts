import type { ISuiteChange } from '@/modules/Automation/types';

/**
 * Os testes novos pedidos ao agente, os mais recentes primeiro, o escolhido, e como
 * escolher um.
 */
export interface ISuiteRequestsProps {
  requests: ISuiteChange[];
  pickedId: string | null;
  onPick: (changeId: string) => void;
}
