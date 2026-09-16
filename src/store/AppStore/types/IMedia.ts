/** What the lightbox is showing: a screenshot the run took, or nothing when the step had none. */
export interface IMedia {
  kicker: string;
  title: string;
  isTall: boolean;
  src: string | null;
}
