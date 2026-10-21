/** A branch name as it goes in a GitHub API path: each part escaped, the slashes between them kept. */
export function refPath(ref: string): string {
  return ref.split('/').map(encodeURIComponent).join('/');
}
