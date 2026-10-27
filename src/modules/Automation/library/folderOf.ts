/**
 * The folder a suite's file sits in, from the suite's own folder: '' for a file at its
 * root.
 */
export function folderOf(file: string): string {
  const at = file.lastIndexOf('/');

  return at === -1 ? '' : file.slice(0, at);
}
