/** A piece of a recording's file, written at `position`, because the MP4 index goes back to patch its start. */
export interface IRecordingChunk {
  id: string;
  position: number;
  data: Uint8Array;
}
