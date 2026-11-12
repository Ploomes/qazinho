import { describe, expect, it } from 'vitest';
import { NETWORK } from '@/modules/Run/constants';

describe('NETWORK', () => {
  /** Só as chamadas de API ficam à vista; a página, os arquivos e o favicon vão para o resto. */
  it('counts as API calls only what the app asked its servers, never a page or a file', () => {
    const apis: readonly string[] = NETWORK.apiTypes;

    for (const type of ['fetch', 'xhr', 'websocket', 'eventsource'])
      expect(apis).toContain(type);
    for (const type of ['document', 'other', 'image', 'script', 'stylesheet', 'font'])
      expect(apis).not.toContain(type);
  });

  it('names every kind of request with a short label of its own', () => {
    const labels = Object.values(NETWORK.types);

    expect(new Set(labels).size).toBe(labels.length);
    expect(labels.every((label) => label.length <= 5)).toBe(true);
  });

  it('gives every kind of API call a label', () => {
    expect(NETWORK.apiTypes.every((type) => type in NETWORK.types)).toBe(true);
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
