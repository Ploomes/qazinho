import type { IProjectIconMark } from './IProjectIconMark';
import type { IProjectInitialMark } from './IProjectInitialMark';
import type { IProjectPlatformMark } from './IProjectPlatformMark';

/** O que fica ao lado do nome de um projeto: ícone do site, plataforma ou inicial. */
export type ProjectMarkShape =
  IProjectIconMark | IProjectPlatformMark | IProjectInitialMark;
