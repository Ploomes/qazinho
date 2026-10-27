import type { ISuiteChangeFile } from '@/shared/types';

const SPEC = /\.(spec|test)\.[cm]?[jt]sx?$/;

/**
 * The spec files a change added or touched, from the suite's folder, for QAzinho to run
 * again.
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
