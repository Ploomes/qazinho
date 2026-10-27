import type { IProLink, IProOrgProject, IProShare, ProStatus } from '@/shared/types';

/** Where this machine stands with the QA's account, and each project's sending. */
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
