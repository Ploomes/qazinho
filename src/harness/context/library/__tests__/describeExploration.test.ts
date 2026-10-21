import { describe, expect, it } from 'vitest';
import { describeExploration } from '@/harness/context/library';

describe('describeExploration', () => {
  it('says how long to explore, and what the device shows to start from', () => {
    expect(
      describeExploration({
        minutes: 10,
        screen: 'Shop · [link] Cart',
        variables: [],
        known: [],
      }),
    ).toBe(
      [
        'Explore the app for 10 minutes: note each screen the first time you reach it, file what is wrong, and call finish before the time is up.',
        '',
        'The device shows right now:',
        'Shop · [link] Cart',
      ].join('\n'),
    );
  });

  it('lists the variables the explorer may type', () => {
    expect(
      describeExploration({
        minutes: 5,
        screen: '',
        variables: [{ name: 'SHOP_EMAIL', description: 'The buyer' }],
        known: [],
      }),
    ).toContain(
      'Variables the project keeps, to type as written:\n- ${SHOP_EMAIL}: The buyer',
    );
  });
});
