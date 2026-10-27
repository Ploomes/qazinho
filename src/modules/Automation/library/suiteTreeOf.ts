import type { ISuiteFolder, ISuiteTest } from '@/modules/Automation/types';
import { folderOf } from './folderOf';

/**
 * A suite's tests by folder and file, in path order and each file's tests in the order
 * they are written; a query keeps the tests whose title, describes, file or tags hold it.
 */
export function suiteTreeOf(props: {
  tests: ISuiteTest[];
  query: string;
}): ISuiteFolder[] {
  const query = props.query.trim().toLowerCase();
  const kept =
    query === ''
      ? props.tests
      : props.tests.filter((test) =>
          [
            test.title,
            test.file,
            ...test.path,
            ...test.tags.map((tag) => `@${tag}`),
          ].some((text) => text.toLowerCase().includes(query)),
        );
  const folders = new Map<string, Map<string, ISuiteTest[]>>();

  for (const test of kept) {
    const files = folders.get(folderOf(test.file)) ?? new Map<string, ISuiteTest[]>();

    files.set(test.file, [...(files.get(test.file) ?? []), test]);
    folders.set(folderOf(test.file), files);
  }

  return [...folders.entries()]
    .sort(([one], [other]) => one.localeCompare(other))
    .map(([path, files]) => ({
      path,
      name: nameOf(path) === '' ? path : nameOf(path),
      files: [...files.entries()]
        .sort(([one], [other]) => one.localeCompare(other))
        .map(([file, tests]) => ({
          path: file,
          name: nameOf(file),
          tests: [...tests].sort((one, other) => one.line - other.line),
        })),
    }));
}

function nameOf(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}
