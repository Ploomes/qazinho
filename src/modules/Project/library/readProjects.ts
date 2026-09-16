import type { IProject } from '@/modules/Project/types';

/** The file on disk belongs to the QA, so anything unreadable in it is skipped, not fatal. */
export function readProjects(json: string): IProject[] {
  let read: unknown;

  try {
    read = JSON.parse(json);
  } catch {
    return [];
  }

  if (!Array.isArray(read)) return [];

  return read.filter(
    (one): one is IProject =>
      typeof one === 'object' &&
      one !== null &&
      typeof (one as IProject).id === 'string' &&
      Array.isArray((one as IProject).targets),
  );
}
