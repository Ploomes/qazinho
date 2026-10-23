import type { IUnreadPlan } from './IUnreadPlan';

/** A workspace as it sits on disk. The plan is a YAML file of its own, so a QA can edit it; `unreadPlan` comes from disk only, when that file did not read. */
export interface ISavedWorkspace {
  id: string;
  json: string;
  planYaml: string;
  unreadPlan?: IUnreadPlan;
}
