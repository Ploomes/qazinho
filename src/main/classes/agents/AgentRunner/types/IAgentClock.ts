/**
 * The clock that ends an agent turn that runs too long: armed while it ticks, with the
 * time it has left from when it last started.
 */
export interface IAgentClock {
  timer: NodeJS.Timeout | null;
  leftMs: number;
  since: number;
}
