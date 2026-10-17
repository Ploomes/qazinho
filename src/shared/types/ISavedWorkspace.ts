/** A workspace as it sits on disk. The plan is a YAML file of its own, so a QA can edit it. */
export interface ISavedWorkspace {
  id: string;
  json: string;
  planYaml: string;
}
