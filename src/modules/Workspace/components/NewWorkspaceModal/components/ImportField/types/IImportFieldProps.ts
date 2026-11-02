import type { IImportSource } from '@/shared/types';

/** A pasta de testes de um workspace novo: a escolhida, e como mudá-la. */
export interface IImportFieldProps {
  folder: IImportSource | null;
  onChange: (folder: IImportSource | null) => void;
}
