/** One element of the accessibility tree, with the point a finger would land on. */
export interface IScreenElement {
  label: string;
  role: string;
  x: number;
  y: number;
}
