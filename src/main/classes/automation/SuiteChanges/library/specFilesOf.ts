import type { ISuiteChangeFile } from '@/shared/types';

const SPEC = /\.(spec|test)\.[cm]?[jt]sx?$/;

/**
 * Os arquivos de spec que uma mudança adicionou ou tocou, a partir da pasta da suíte,
 * para o QAzinho rodar de novo.
 */
export function specFilesOf(props: {
  files: ISuiteChangeFile[];
  prefix: string;
}): string[] {
  const folder = props.prefix.replace(/\\/g, '/').replace(/\/+$/, '');
  const prefix = folder === '' ? '' : `${folder}/`;

  return props.files
    .filter(({ path, status }) => status !== 'deleted' && SPEC.test(path))
    .filter(({ path }) => path.startsWith(prefix))
    .map(({ path }) => path.slice(prefix.length));
}
