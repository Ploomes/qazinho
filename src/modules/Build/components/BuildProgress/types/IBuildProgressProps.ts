/** One build to follow, and what to do when the QA wants to try again after it failed or stopped, when it can be tried again there. */
export interface IBuildProgressProps {
  buildId: string;
  onRetry?: () => void;
}
