import type { StorageKind } from '@/modules/Settings/types';

/** Um jeito de ocupar disco, pronto para a legenda e para a barra, nas palavras do QA. */
export interface IStorageRow {
  id: StorageKind;
  label: string;
  size: string;
  share: string;
  bytes: number;
  isPending: boolean;
  className: string;
  swatchClassName: string;
  segmentClassName: string;
}
