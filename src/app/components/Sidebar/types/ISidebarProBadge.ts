/**
 * A project's link to QAzinho Pro on its header: what it says, and how many plans wait to
 * be sent or came from the org.
 */
export interface ISidebarProBadge {
  label: string;
  tip: string;
  pending: number;
  updates: number;
  hasPending: boolean;
  hasUpdates: boolean;
}
