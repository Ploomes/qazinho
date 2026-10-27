import { dirname, join, parse } from 'node:path';
import { SUITE_REGISTRY } from '@/main/classes/automation/SuiteRegistry/constants';

/**
 * Where a suite's Playwright Test could be installed, from its own folder up to the root,
 * the way Node looks for a package.
 */
export function runnerPathsOf(path: string): string[] {
  const { root } = parse(path);
  const paths: string[] = [];

  for (let folder = path; ; folder = dirname(folder)) {
    paths.push(join(folder, ...SUITE_REGISTRY.runner));

    if (folder === root || dirname(folder) === folder) return paths;
  }
}
