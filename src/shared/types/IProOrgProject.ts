/** A project an org of QAzinho Pro holds, as this computer may download it: its name, and each plan by name and size. */
export interface IProOrgProject {
  orgSlug: string;
  projectId: string;
  key: string;
  name: string;
  plans: { workspaceId: string; name: string; cases: number }[];
}
