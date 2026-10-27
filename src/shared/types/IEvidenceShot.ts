/**
 * A screen that goes with a bug, by the name it takes in the tracker: the file the run
 * kept, or the picture still in hand.
 */
export interface IEvidenceShot {
  name: string;
  file: string | null;
  src: string | null;
}
