import type { IAgentLine } from '@/main/types';
import type { IAgentUsage } from '@/shared/types';

const EMPTY: IAgentUsage = {
  fiveHourUsed: null,
  sevenDayUsed: null,
  resetsAt: 0,
  contextTokens: 0,
  contextWindow: 0,
};

/**
 * Reads the limits the account is against, and how much context the turn actually
 * carried.
 */
export function toUsage(props: {
  previous: IAgentUsage | null;
  line: IAgentLine;
}): IAgentUsage {
  const { line } = props;
  const usage = props.previous ?? EMPTY;
  const windows = line.rate_limit_info?.unifiedWindows;

  if (windows) {
    return {
      ...usage,
      fiveHourUsed: windows.five_hour?.utilization ?? usage.fiveHourUsed,
      sevenDayUsed: windows.seven_day?.utilization ?? usage.sevenDayUsed,
      resetsAt:
        windows.five_hour?.resetsAt ?? line.rate_limit_info?.resetsAt ?? usage.resetsAt,
    };
  }

  if (line.type !== 'result') return usage;

  const windowSize = Object.values(line.modelUsage ?? {})
    .map(({ contextWindow }) => contextWindow ?? 0)
    .reduce((biggest, one) => Math.max(biggest, one), 0);

  return {
    ...usage,
    contextTokens:
      (line.usage?.input_tokens ?? 0) + (line.usage?.cache_read_input_tokens ?? 0),
    contextWindow: windowSize > 0 ? windowSize : usage.contextWindow,
  };
}
