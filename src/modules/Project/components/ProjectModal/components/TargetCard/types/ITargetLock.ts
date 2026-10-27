/**
 * Why a part of a project cannot be used on this machine yet, and how to fix it: a guide
 * to follow, or one thing QAzinho does.
 */
export interface ITargetLock {
  reason: string;
  setUp:
    | { label: string; guide: string; link: { label: string; url: string } }
    | { label: string; onSetUp: () => void }
    | null;
}
