import type { IProLink, IProOrgProject, IProShare, ProStatus } from '@/shared/types';

/** Where this machine stands with QAzinho Pro, null until it is read, where each project's sending stands, the projects of the org it sends to, and a link to a plan this computer does not hold yet. */
export interface IProStore {
  status: ProStatus | null;
  shares: IProShare[];
  orgProjects: IProOrgProject[];
  link: IProLink | null;
  setStatus: (status: ProStatus) => void;
  setShares: (shares: IProShare[]) => void;
  landShare: (share: IProShare) => void;
  setOrgProjects: (projects: IProOrgProject[]) => void;
  setLink: (link: IProLink | null) => void;
}
