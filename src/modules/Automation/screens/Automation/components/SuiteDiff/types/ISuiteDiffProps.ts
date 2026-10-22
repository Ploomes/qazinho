import type { ISuiteChangeFile } from '@/shared/types';

/** One file a change touched, shown open at first or folded. */
export interface ISuiteDiffProps {
  file: ISuiteChangeFile;
  isOpenAtFirst: boolean;
}
