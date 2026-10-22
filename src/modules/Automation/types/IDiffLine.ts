/** One line of a file's diff as the review shows it: a hunk's head, a line added, a line removed or one kept, with its number before and after. */
export interface IDiffLine {
  key: string;
  kind: 'hunk' | 'add' | 'del' | 'same';
  text: string;
  old: number | null;
  new: number | null;
}
