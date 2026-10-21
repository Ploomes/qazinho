import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { BUILD_FAILURE_KEYS, BUILD_STEPS } from '@/modules/Build/constants';

describe('BUILD_STEPS', () => {
  it('goes from the code to the agent to what it made', () => {
    expect(BUILD_STEPS).toEqual(['code', 'agent', 'artifact']);
  });
});

describe('BUILD_FAILURE_KEYS', () => {
  it('says every way a build ends with nothing, in both languages', () => {
    for (const key of Object.values(BUILD_FAILURE_KEYS))
      for (const language of ['en', 'pt'])
        expect(i18n.exists(key, { lng: language }), `${key} in ${language}`).toBe(true);
  });
});
