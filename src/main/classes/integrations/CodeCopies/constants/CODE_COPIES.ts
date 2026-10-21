export const CODE_COPIES = {
  diffBytes: 4 * 1024 * 1024,
  changes: 300,
  compareJq:
    '{commits: .ahead_by, files: [.files[] | {path: .filename, status, additions, deletions}]}',
  diffAccept: 'application/vnd.github.diff',
  progressMs: 250,
} as const;
