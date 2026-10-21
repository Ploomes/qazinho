/** Where a moment of the video falls: the case and step it shows, or the gap after a case while the app opens anew. */
export interface IReplayMoment {
  chapterIndex: number;
  stepIndex: number;
  isBetween: boolean;
}
