import { describe, expect, it } from 'vitest';
import {
  SIDEBAR_PROJECT_SIGNAL_KEYS,
  SIDEBAR_SIGNAL,
} from '@/app/components/Sidebar/constants';

describe('SIDEBAR_PROJECT_SIGNAL_KEYS', () => {
  it('names in words every signal a project can wear', () => {
    expect(Object.keys(SIDEBAR_PROJECT_SIGNAL_KEYS).sort()).toEqual(
      Object.keys(SIDEBAR_SIGNAL).sort(),
    );
  });
});
