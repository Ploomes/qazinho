import type { IProOrgProject, IProShare, ProStatus } from '@/shared/types';

/** Where this machine stands with QAzinho Pro, null until it is read, where each project's sending stands, and the projects of the org it sends to. */
export interface IProStore {
  status: ProStatus | null;
  shares: IProShare[];
  orgProjects: IProOrgProject[];
  setStatus: (status: ProStatus) => void;
  setShares: (shares: IProShare[]) => void;
  landShare: (share: IProShare) => void;
  setOrgProjects: (projects: IProOrgProject[]) => void;
}
