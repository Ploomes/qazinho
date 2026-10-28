import type { ISuiteChangeFile } from '@/shared/types';

/** Um arquivo que uma mudança tocou, mostrado aberto no começo ou dobrado. */
export interface ISuiteDiffProps {
  file: ISuiteChangeFile;
  isOpenAtFirst: boolean;
}
