/**
 * Uma branch de um repositório: se é a própria do repositório, o pull request que ela
 * encabeça, e quando se mexeu por último.
 */
export interface IBranch {
  name: string;
  isDefault: boolean;
  pullRequest: { number: number; title: string } | null;
  movedAt: string | null;
}
