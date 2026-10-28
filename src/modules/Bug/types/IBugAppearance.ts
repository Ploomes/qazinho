/**
 * Uma vez em que um bug foi pego: a run e quando ela começou, o passo que andava, e
 * quando no vídeo da run.
 */
export interface IBugAppearance {
  runId: string;
  runWhen: string;
  caseId: string;
  stepNumber: number;
  at: number | null;
}
