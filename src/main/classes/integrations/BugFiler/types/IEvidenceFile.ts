/**
 * Um arquivo que vai com um bug como o tracker o aceita: o nome, o tipo e os bytes dele.
 */
export interface IEvidenceFile {
  name: string;
  type: string;
  bytes: Uint8Array;
}
