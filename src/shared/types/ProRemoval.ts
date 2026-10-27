/**
 * A project deleted in its org and unlinked here, or why the org kept it: a CI job still
 * going, a role that may not, no answer, a signed-out machine or a refusal.
 */
export type ProRemoval =
  | { isRemoved: true }
  | {
      isRemoved: false;
      failure: 'busy' | 'forbidden' | 'unreachable' | 'signed-out' | 'failed';
    };
