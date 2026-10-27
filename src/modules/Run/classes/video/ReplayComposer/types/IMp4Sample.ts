/**
 * One frame of an MP4's video, where its bytes sit in the file and when it shows, in
 * microseconds.
 */
export interface IMp4Sample {
  offset: number;
  size: number;
  timestampUs: number;
  durationUs: number;
  isKey: boolean;
}
