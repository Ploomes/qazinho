/** One element of the accessibility tree, with the point a finger would land on, and whether it is an app's icon on the home screen. */
export interface IScreenElement {
  label: string;
  role: string;
  x: number;
  y: number;
  isLaunchIcon: boolean;
}
