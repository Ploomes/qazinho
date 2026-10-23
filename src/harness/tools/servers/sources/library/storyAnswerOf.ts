import type { IJiraStoryCopy } from '@/shared/types';
import { describeStory, renderSections } from '@/harness/context/library';

/** A story read by the agent's own call, in the very words /jira hands it over. */
export function storyAnswerOf(story: IJiraStoryCopy): string {
  return renderSections([describeStory({ story, wasTold: false })]);
}
