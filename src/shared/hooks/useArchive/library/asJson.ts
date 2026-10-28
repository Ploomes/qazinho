import type { IProject } from '@/modules/Project';

/**
 * O arquivo de projetos é lido por pessoas também, então é escrito do jeito que um editor
 * escreveria.
 */
export function asJson(projects: IProject[]): string {
  return JSON.stringify(projects, null, 2);
}
