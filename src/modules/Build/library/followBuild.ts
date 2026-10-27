import type { IBuild } from '@/modules/Build/types';
import type { IBuildEvent } from '@/shared/types';
import { BUILD_LINES } from '@/modules/Build/constants/BUILD_LINES';

/**
 * A build after one of its events: the step it reached, the agent's latest lines, or how
 * it ended.
 */
export function followBuild(props: { build: IBuild; event: IBuildEvent }): IBuild {
  const { build, event } = props;

  if (event.kind === 'step') return { ...build, step: event.step, bytes: event.bytes };

  if (event.kind === 'line') {
    const text = event.text.trim();

    return text === '' || build.lines.at(-1) === text
      ? build
      : { ...build, lines: [...build.lines, text].slice(-BUILD_LINES) };
  }

  return {
    ...build,
    phase: event.result.isBuilt
      ? 'built'
      : event.result.failure.reason === 'stopped'
        ? 'stopped'
        : 'failed',
    result: event.result,
  };
}
