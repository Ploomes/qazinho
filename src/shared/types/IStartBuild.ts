import type { BuildPlatform } from './BuildPlatform';
import type { IRepositoryRef } from './IRepositoryRef';
import type { Language } from './Language';

/**
 * A build the page asks for: what to build from which branch, the project it is for when
 * there is one, and the agent that builds it.
 */
export interface IStartBuild {
  buildId: string;
  projectId: string | null;
  platform: BuildPlatform;
  repository: IRepositoryRef;
  branch: string;
  agentId: string;
  model: string;
  language: Language;
}
