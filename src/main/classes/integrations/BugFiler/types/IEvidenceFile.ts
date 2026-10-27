/**
 * A file that goes with a bug as its tracker takes it: its name, its type and its bytes.
 */
export interface IEvidenceFile {
  name: string;
  type: string;
  bytes: Uint8Array;
}
