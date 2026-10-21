import type { TargetKind } from './TargetKind';

/** A project as the assistant reads it: its targets, and the repositories it is made of with their base branch. */
export interface IAppProjectBrief {
  id: string;
  name: string;
  targets: { kind: TargetKind; value: string }[];
  repositories: { name: string; base: string }[];
}
