import type { ProjectStory } from './ProjectStory';
import type { IDesignLink, IImportSource } from '@/shared/types';

/** Como um plano do projeto novo começa: pela história, design, testes ou ideia. */
export type NewProjectStart =
  | {
      kind: 'story';
      workspaceId: string;
      story: ProjectStory;
      design: IDesignLink | null;
    }
  | { kind: 'design'; workspaceId: string; design: IDesignLink }
  | { kind: 'import'; workspaceId: string; source: IImportSource }
  | { kind: 'explore'; workspaceId: string }
  | { kind: 'idea'; workspaceId: string; text: string };
