/**
 * Onde um bug fica no vídeo da run dele: a run, e a quanto do vídeo ele foi pego, em ms.
 */
export interface IBugMoment {
  workspaceId: string;
  runId: string;
  atMs: number;
}
