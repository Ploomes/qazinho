import type { BuildPlatform } from './BuildPlatform';
import type { IRepositoryRef } from './IRepositoryRef';
import type { Language } from './Language';

/**
 * Um build que a página pede: o que construir de qual branch, o projeto para o qual é
 * quando há um, e o agente que o constrói.
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
