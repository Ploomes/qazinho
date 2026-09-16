/** The mock engine: a tick every 500 ms, one step resolved every third tick. */
export const RUN_ENGINE = {
  tickSeconds: 0.5,
  ticksPerStep: 3,
  failsAtStep: 5,
} as const;
