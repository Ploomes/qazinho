/** What one git command gave back: its output, or what git said when it refused. */
export type GitAnswer = { isOk: true; text: string } | { isOk: false; said: string };
