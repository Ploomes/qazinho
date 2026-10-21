// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { NETWORK, REQUEST_OUTCOMES } from '@/modules/Run/constants';
import { ICONS } from '@/shared/components/atoms/Icon/constants';

describe('REQUEST_OUTCOMES', () => {
  it('draws every outcome with an icon the app has', () => {
    expect(Object.values(REQUEST_OUTCOMES).every(({ icon }) => icon in ICONS)).toBe(true);
  });

  it('paints every error in a warning colour, and nothing else', () => {
    const errors: readonly string[] = NETWORK.errorOutcomes;

    for (const [outcome, { tone }] of Object.entries(REQUEST_OUTCOMES))
      expect(tone === 'fail' || tone === 'attn').toBe(errors.includes(outcome));
  });

  it('says a word only where no status code speaks for the request', () => {
    expect(REQUEST_OUTCOMES.ok.wordKey).toBeNull();
    expect(REQUEST_OUTCOMES.server.wordKey).toBeNull();
    expect(REQUEST_OUTCOMES.failed.wordKey).toBe('RUN.NETWORK_FAILED');
    expect(REQUEST_OUTCOMES.canceled.wordKey).toBe('RUN.NETWORK_CANCELED');
  });

  it('tells two outcomes of the same colour apart by their icon', () => {
    expect(REQUEST_OUTCOMES.server.icon).not.toBe(REQUEST_OUTCOMES.failed.icon);
    expect(REQUEST_OUTCOMES.redirect.icon).not.toBe(REQUEST_OUTCOMES.canceled.icon);
  });
});
