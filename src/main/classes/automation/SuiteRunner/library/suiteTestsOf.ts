import type { ISuiteTest } from '@/shared/types';
import { join, relative } from 'node:path';

type Entry = Record<string, unknown>;

function isEntry(value: unknown): value is Entry {
  return typeof value === 'object' && value !== null;
}

function listOf(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function textsOf(props: { values: unknown[]; key: string }): string[] {
  return props.values.flatMap((value) => {
    const text = isEntry(value) ? value[props.key] : value;

    return typeof text === 'string' ? [text] : [];
  });
}

/** The tests a Playwright JSON report lists, each with its file from the suite's folder, the describes around it and the projects it runs in; null for text that is not such a report. */
export function suiteTestsOf(props: {
  text: string;
  root: string;
}): { tests: ISuiteTest[]; projects: string[] } | null {
  let report: unknown;

  try {
    report = JSON.parse(props.text);
  } catch {
    return null;
  }

  if (!isEntry(report) || !isEntry(report.config) || !Array.isArray(report.suites))
    return null;

  const rootDir =
    typeof report.config.rootDir === 'string' ? report.config.rootDir : props.root;
  const tests: ISuiteTest[] = [];
  const walk = (suite: unknown, path: string[]) => {
    if (!isEntry(suite)) return;

    for (const spec of listOf(suite.specs)) {
      if (
        !isEntry(spec) ||
        typeof spec.id !== 'string' ||
        typeof spec.title !== 'string' ||
        typeof spec.file !== 'string'
      )
        continue;

      tests.push({
        id: spec.id,
        file: relative(props.root, join(rootDir, spec.file)),
        line: typeof spec.line === 'number' ? spec.line : 0,
        path,
        title: spec.title,
        tags: listOf(spec.tags).filter((tag): tag is string => typeof tag === 'string'),
        projects: [
          ...new Set(textsOf({ values: listOf(spec.tests), key: 'projectName' })),
        ],
      });
    }

    for (const child of listOf(suite.suites))
      walk(
        child,
        isEntry(child) && typeof child.title === 'string' ? [...path, child.title] : path,
      );
  };

  for (const file of report.suites) walk(file, []);

  return {
    tests,
    projects: textsOf({ values: listOf(report.config.projects), key: 'name' }),
  };
}
