import type { ISuiteChangeFile } from '@/shared/types';

const SPEC = /\.(spec|test)\.[cm]?[jt]sx?$/;

/** The spec files a change added or touched, from the suite's folder (git's slashes, whatever the platform wrote), for QAzinho to run again; a file outside the suite, or one the change deleted, is left out. */
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
