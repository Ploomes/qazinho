/**
 * How one agent CLI signs its user in: the command after the binary, and whether it may
 * ask for a code the page shows.
 */
export interface ILoginRecipe {
  args: string[];
  takesCode: boolean;
}
