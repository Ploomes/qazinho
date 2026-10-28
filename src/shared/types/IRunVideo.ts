/**
 * A gravação de uma run: `startedAt` é quando o primeiro frame aparece, em ms de epoch,
 * para todo momento da run achar o lugar nela.
 */
export interface IRunVideo {
  startedAt: number;
  durationMs: number;
  width: number;
  height: number;
}
