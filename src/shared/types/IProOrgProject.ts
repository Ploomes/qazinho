/**
 * Um projeto que uma org do QAzinho Pro guarda, como este computador pode baixá-lo: o
 * nome, e cada plano por nome e tamanho.
 */
export interface IProOrgProject {
  orgSlug: string;
  projectId: string;
  key: string;
  name: string;
  plans: { workspaceId: string; name: string; cases: number }[];
}
