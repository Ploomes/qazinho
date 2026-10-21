import type { IAppToolRequest } from '@/shared/types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppBridge } from '@/main/classes/assistant/AppBridge';

/** A page that only remembers what reached it, answering when the test says so. */
function bridgeTo(props: { isOpen: boolean }) {
  const sent: IAppToolRequest[] = [];
  const bridge = new AppBridge({
    timeoutMs: 1_000,
    send: (request) => {
      if (props.isOpen) sent.push(request);

      return props.isOpen;
    },
  });

  return { bridge, sent };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('AppBridge', () => {
  describe('act', () => {
    it('hands the call to the page and answers with what the page did', async () => {
      const { bridge, sent } = bridgeTo({ isOpen: true });
      const acting = bridge.act({ name: 'go_home', args: {} });

      expect(sent).toEqual([
        { id: expect.any(String), call: { name: 'go_home', args: {} } },
      ]);

      bridge.answer({
        id: sent[0]?.id ?? '',
        text: 'Home is on screen.',
        isError: false,
      });

      expect(await acting).toEqual({ text: 'Home is on screen.', isError: false });
    });

    it('says nothing was done when no window can take the call', async () => {
      const { bridge } = bridgeTo({ isOpen: false });

      expect(await bridge.act({ name: 'go_home', args: {} })).toEqual({
        text: "QAzinho's window is not open, so nothing was done.",
        isError: true,
      });
    });

    it('gives up on a page that never answers, and drops its late answer', async () => {
      vi.useFakeTimers();

      const { bridge, sent } = bridgeTo({ isOpen: true });
      const acting = bridge.act({ name: 'go_home', args: {} });

      await vi.advanceTimersByTimeAsync(1_000);

      expect(await acting).toEqual({
        text: 'QAzinho did not answer in time, so nothing was done.',
        isError: true,
      });

      bridge.answer({ id: sent[0]?.id ?? '', text: 'Too late.', isError: false });
    });
  });

  describe('answer', () => {
    it('settles only the call it answers, when two wait at once', async () => {
      const { bridge, sent } = bridgeTo({ isOpen: true });
      const first = bridge.act({ name: 'go_home', args: {} });
      const second = bridge.act({ name: 'open_settings', args: {} });

      bridge.answer({ id: sent[1]?.id ?? '', text: 'Settings.', isError: false });
      bridge.answer({ id: sent[0]?.id ?? '', text: 'Home.', isError: false });

      expect(await second).toEqual({ text: 'Settings.', isError: false });
      expect(await first).toEqual({ text: 'Home.', isError: false });
    });

    it('does NOT throw on an answer nobody waits for', () => {
      const { bridge } = bridgeTo({ isOpen: true });

      expect(() => {
        bridge.answer({ id: 'nobody', text: '', isError: false });
      }).not.toThrow();
    });
  });

  describe('dropAll', () => {
    it('lets every waiting call go once the page is gone', async () => {
      const { bridge } = bridgeTo({ isOpen: true });
      const acting = bridge.act({ name: 'delete_project', args: { project: 'p-1' } });

      bridge.dropAll();

      expect(await acting).toEqual({
        text: "QAzinho's window is not open, so nothing was done.",
        isError: true,
      });
    });
  });
});
