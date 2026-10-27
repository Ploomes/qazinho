/**
 * A plan.yaml QAzinho could not read, set aside under `file` in the workspace's folder so
 * nothing writes over it; `line` is where it broke, when the YAML itself did.
 */
export interface IUnreadPlan {
  file: string;
  line: number | null;
}
