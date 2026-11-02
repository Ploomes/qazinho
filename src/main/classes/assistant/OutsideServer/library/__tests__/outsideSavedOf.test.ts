import { describe, expect, it } from 'vitest';
import { outsideSavedOf } from '@/main/classes/assistant/OutsideServer/library';

describe('outsideSavedOf', () => {
  it('reads what was saved', () => {
    expect(outsideSavedOf('{"isOn":true,"port":4000,"token":"abc"}')).toEqual({
      isOn: true,
      port: 4000,
      token: 'abc',
    });
  });

  it.each([
    '',
    'not json',
    '{}',
    '{"isOn":true,"port":"4000","token":"abc"}',
    '{"isOn":true,"port":4000,"token":""}',
  ])('takes %j as nothing saved', (text) => {
    expect(outsideSavedOf(text)).toBeNull();
  });
});
