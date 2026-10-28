/**
 * O fim de uma gravação: o último frame dela segura até `at`, o momento em que a run
 * terminou, em ms de epoch.
 */
export interface IRecordingStop {
  id: string;
  at: number;
}
