import type { IProject } from '@/modules/Project';

/** The projects file is read by people too, so it is written the way an editor would. */
export function asJson(projects: IProject[]): string {
  return JSON.stringify(projects, null, 2);
}
