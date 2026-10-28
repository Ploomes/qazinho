import type { IUnreadPlan } from './IUnreadPlan';

/**
 * Um workspace como fica no disco. O plano é um arquivo YAML próprio, para um QA poder
 * editá-lo; `unreadPlan` vem só do disco, quando esse arquivo não leu.
 */
export interface ISavedWorkspace {
  id: string;
  json: string;
  planYaml: string;
  unreadPlan?: IUnreadPlan;
}
