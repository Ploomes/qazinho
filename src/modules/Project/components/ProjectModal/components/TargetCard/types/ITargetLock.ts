/** Why a target cannot be used on this machine yet, and, when it can be fixed, how. */
export interface ITargetLock {
  reason: string;
  setUp: { label: string; guide: string; link: { label: string; url: string } } | null;
}
