import type { IImportSource } from '@/shared/types';

/** A pasta de testes que o QA escolheu, como o QAzinho a leu, ou nenhuma ainda. */
export interface ITestsFieldProps {
  value: IImportSource | null;
  onChange: (value: IImportSource | null) => void;
}
