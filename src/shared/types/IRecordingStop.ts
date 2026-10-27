/**
 * The end of a recording: its last frame holds until `at`, the moment the run ended, in
 * epoch ms.
 */
export interface IRecordingStop {
  id: string;
  at: number;
}
