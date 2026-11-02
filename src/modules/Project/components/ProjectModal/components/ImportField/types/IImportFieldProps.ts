import type { IImportSource } from '@/shared/types';

/** O campo de importar testes de um projeto novo: a pasta escolhida e como mudá-la. */
export interface IImportFieldProps {
  folder: IImportSource | null;
  onChange: (folder: IImportSource | null) => void;
}
