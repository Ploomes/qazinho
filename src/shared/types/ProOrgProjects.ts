import type { IProOrgProject } from './IProOrgProject';

/**
 * The projects an org holds, or why they could not be read: signed out, no answer, or a
 * refusal.
 */
export type ProOrgProjects =
  | { isListed: true; projects: IProOrgProject[] }
  | { isListed: false; failure: 'signed-out' | 'unreachable' | 'failed' };
