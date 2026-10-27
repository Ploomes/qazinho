/**
 * A link from QAzinho Pro that opens a plan here: its org, and the ids its project and
 * workspace are kept under.
 */
export interface IProLink {
  orgSlug: string;
  projectId: string;
  workspaceId: string;
}
