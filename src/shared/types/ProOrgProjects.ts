import type { IProOrgProject } from './IProOrgProject';

/**
 * Os projetos que uma org guarda, ou por que não puderam ser lidos: deslogado, nenhuma
 * resposta, ou uma recusa.
 */
export type ProOrgProjects =
  | { isListed: true; projects: IProOrgProject[] }
  | { isListed: false; failure: 'signed-out' | 'unreachable' | 'failed' };
