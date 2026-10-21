import { describe, expect, it } from 'vitest';
import { NETWORK } from '@/modules/Run/constants';

describe('NETWORK', () => {
  it('keeps the calls a QA reads out of the files it hides', () => {
    const files: readonly string[] = NETWORK.fileTypes;

    for (const type of ['document', 'fetch', 'xhr', 'websocket', 'eventsource', 'other'])
      expect(files).not.toContain(type);
  });

  it('names every kind of request with a short label of its own', () => {
    const labels = Object.values(NETWORK.types);

    expect(new Set(labels).size).toBe(labels.length);
    expect(labels.every((label) => label.length <= 5)).toBe(true);
  });

  it('gives every file it hides a label', () => {
    expect(NETWORK.fileTypes.every((type) => type in NETWORK.types)).toBe(true);
  });

  it('fills a bar a whole decade at a time, a ten-second request reaching the end', () => {
    expect(10 ** NETWORK.barDecades).toBe(10_000);
  });

  it('jumps a little before a request, closer than a fresh row lasts', () => {
    expect(NETWORK.leadMs).toBeLessThan(NETWORK.freshMs);
  });

  it('reads only an abort as a request the app gave up on', () => {
    expect(NETWORK.canceled.test('net::ERR_ABORTED')).toBe(true);
    expect(NETWORK.canceled.test('net::ERR_CONNECTION_REFUSED')).toBe(false);
  });
});
