/**
 * Um plano que o QA pediu a partir de uma pasta de testes dele: o nome da pasta, os
 * frameworks que o QAzinho reconheceu nela e quantos arquivos de teste ela tem.
 */
export interface IImportCommand {
  id: 'import-plan';
  name: string;
  frameworks: string[];
  tests: number;
}
