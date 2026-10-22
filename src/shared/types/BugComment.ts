import type { FilingFailure } from './FilingFailure';

/** How posting an update went: where the comment sits, with the files the tracker did not take, or why it was not posted, in the tracker's words. */
export type BugComment =
  | { isPosted: true; url: string; missed: string[] }
  | { isPosted: false; failure: FilingFailure; said: string };
