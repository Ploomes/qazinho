import { describe, expect, it } from 'vitest';
import { AGENT_ACTIVITY } from '@/modules/Chat/constants';
import { withActivity } from '@/modules/Chat/library';

describe('the last things the agent did', () => {
  it('adds what it just did at the end', () => {
    const one = withActivity({ activities: [], tool: 'look', target: '' });

    expect(withActivity({ activities: one, tool: 'click', target: 'Salvar' })).toEqual([
      { id: 1, tool: 'look', target: '' },
      { id: 2, tool: 'click', target: 'Salvar' },
    ]);
  });

  it('keeps one line for the same thing done twice in a row', () => {
    const one = withActivity({ activities: [], tool: 'look', target: '' });

    expect(withActivity({ activities: one, tool: 'look', target: '' })).toBe(one);
  });

  it('leaves out a tool it has no words for', () => {
    expect(
      withActivity({ activities: [], tool: 'StructuredOutput', target: '' }),
    ).toEqual([]);
    expect(withActivity({ activities: [], tool: 'constructor', target: '' })).toEqual([]);
  });

  it('keeps what the agent said on top of the actions until the step ends', () => {
    let activities = withActivity({
      activities: [],
      tool: 'say',
      target: 'Creating a template first',
    });

    for (const target of ['a', 'b', 'c', 'd', 'e'])
      activities = withActivity({ activities, tool: 'click', target });

    expect(activities[0]).toMatchObject({ tool: 'say' });
    expect(activities).toHaveLength(AGENT_ACTIVITY.kept + 1);
    expect(
      withActivity({ activities, tool: 'report', target: '' }).some(
        ({ tool }) => tool === 'say',
      ),
    ).toBe(false);
  });

  it('forgets the oldest, and never repeats an id', () => {
    let activities = withActivity({ activities: [], tool: 'look', target: '' });

    for (let at = 0; at < AGENT_ACTIVITY.kept + 2; at += 1)
      activities = withActivity({ activities, tool: 'click', target: String(at) });

    expect(activities).toHaveLength(AGENT_ACTIVITY.kept);
    expect(new Set(activities.map(({ id }) => id)).size).toBe(AGENT_ACTIVITY.kept);
    expect(activities.at(-1)?.target).toBe(String(AGENT_ACTIVITY.kept + 1));
  });
});
