/** What the lightbox is showing: a screenshot in hand, or one still on disk to be read back. */
export interface IMedia {
  kicker: string;
  title: string;
  src: string | null;
  file: string | null;
}
