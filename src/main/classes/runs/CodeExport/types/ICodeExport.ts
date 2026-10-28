import type { ITargetUnderTest } from '@/shared/types';

/**
 * O que o CodeExport precisa: onde os workspaces guardam as receitas, uma pasta que o QA
 * escolhe, e o id de um app de celular lido do arquivo dele.
 */
export interface ICodeExport {
  dataRoot: string;
  chooseFolder: () => Promise<string | null>;
  appIdOf: (target: ITargetUnderTest) => Promise<string | null>;
}
