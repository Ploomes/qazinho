import type { ProcessOwners } from '@/main/classes/resources/ProcessOwners';

export interface IResourceCollector {
  owners: ProcessOwners;
  profileRoot: string;
}
