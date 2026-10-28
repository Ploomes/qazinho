/**
 * Um pedaço do arquivo de uma gravação, escrito em `position`, porque o índice do MP4
 * volta para remendar o começo.
 */
export interface IRecordingChunk {
  id: string;
  position: number;
  data: Uint8Array;
}
