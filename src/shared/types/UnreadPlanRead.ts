/** A plan set aside, read again once the QA fixed it: its YAML, where it still breaks, or gone from the folder. */
export type UnreadPlanRead =
  | { status: 'read'; yaml: string }
  | { status: 'unreadable'; line: number | null }
  | { status: 'gone' };
