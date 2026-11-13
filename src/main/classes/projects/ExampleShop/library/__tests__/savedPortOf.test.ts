import { describe, expect, it } from 'vitest';
import { savedPortOf } from '@/main/classes/projects/ExampleShop/library';

describe('savedPortOf', () => {
  it('reads the port the shop opened on last time', () => {
    expect(savedPortOf('{"port":47821}')).toBe(47_821);
  });

  it('reads none from nothing, broken text or a port that cannot be', () => {
    expect(savedPortOf('')).toBeNull();
    expect(savedPortOf('{"port":')).toBeNull();
    expect(savedPortOf('{"port":0}')).toBeNull();
    expect(savedPortOf('{"port":70000}')).toBeNull();
    expect(savedPortOf('{"port":"47821"}')).toBeNull();
  });
});
