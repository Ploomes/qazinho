/** How many files a unified diff touches: one per diff --git header. */
export function filesInDiff(diff: string): number {
  return diff.match(/^diff --git /gm)?.length ?? 0;
}
