import { describe, expect, it } from 'vitest';
import { parseActions } from '@/main/classes/runs/RunCoordinator/library';

describe('parseActions', () => {
  it('reads the actions the agent asked for', () => {
    const answer = JSON.stringify({
      actions: [
        { kind: 'goto', target: 'https://shop.test', value: '' },
        { kind: 'fill', target: 'Email', value: 'qa@shop.test' },
      ],
    });

    expect(parseActions(answer)).toEqual([
      { kind: 'goto', target: 'https://shop.test', value: '' },
      { kind: 'fill', target: 'Email', value: 'qa@shop.test' },
    ]);
  });

  it('drops an action gocrash cannot carry out', () => {
    const answer = JSON.stringify({
      actions: [
        { kind: 'hack', target: 'the database', value: '' },
        { kind: 'click', target: 'Buy', value: '' },
      ],
    });

    expect(parseActions(answer)).toEqual([{ kind: 'click', target: 'Buy', value: '' }]);
  });

  it('answers nothing when the agent did not answer in json', () => {
    expect(parseActions('I cannot do that')).toEqual([]);
  });

  it('survives a target the agent left out', () => {
    const answer = JSON.stringify({ actions: [{ kind: 'wait' }] });

    expect(parseActions(answer)).toEqual([{ kind: 'wait', target: '', value: '' }]);
  });
});
