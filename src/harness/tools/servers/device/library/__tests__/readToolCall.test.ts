import { describe, expect, it } from 'vitest';
import { readToolCall } from '@/harness/tools/servers/device/library';

const REPORT = {
  step: 2,
  verdict: 'failed',
  why: ' The total is wrong ',
  got: 'R$ 0,00',
};

describe('readToolCall', () => {
  describe('actions', () => {
    it('turns a tool call into the action the device carries out', () => {
      expect(
        readToolCall({ name: 'fill', args: { target: 'Email', value: 'qa@shop.test' } }),
      ).toEqual({
        kind: 'act',
        action: { kind: 'fill', target: 'Email', value: 'qa@shop.test' },
      });
    });

    /**
     * Asked to close the app and open it again, the runner had only goto, which brings a phone
     * app back as it was, and back, which leaves it running: the app never really closed.
     */
    it('reads reopen, which closes the app completely and opens it again, with nothing to aim at', () => {
      expect(readToolCall({ name: 'reopen', args: undefined })).toEqual({
        kind: 'act',
        action: { kind: 'reopen', target: '', value: '' },
      });
    });

    it('carries the answer a click gives the dialog it opens', () => {
      expect(
        readToolCall({ name: 'click', args: { target: 'Delete', dialog: 'cancel' } }),
      ).toEqual({
        kind: 'act',
        action: { kind: 'click', target: 'Delete', value: '', dialog: 'cancel' },
      });
    });

    it('carries what a click types into the prompt it opens', () => {
      expect(
        readToolCall({
          name: 'click',
          args: { target: 'Edit', promptText: 'New title' },
        }),
      ).toEqual({
        kind: 'act',
        action: { kind: 'click', target: 'Edit', value: '', promptText: 'New title' },
      });
    });

    it('does NOT take a dialog answer other than ok or cancel', () => {
      expect(
        readToolCall({ name: 'click', args: { target: 'Delete', dialog: 'maybe' } }),
      ).toEqual({ kind: 'refused', error: '"dialog" is ok or cancel.' });
    });

    it('waits without a target', () => {
      expect(readToolCall({ name: 'wait', args: { value: '500' } })).toEqual({
        kind: 'act',
        action: { kind: 'wait', target: '', value: '500' },
      });
    });

    it('fills a field with nothing, which clears it', () => {
      expect(
        readToolCall({ name: 'fill', args: { target: 'Coupon', value: '' } }),
      ).toMatchObject({
        kind: 'act',
      });
    });

    it('does NOT act on a control nobody named, and tells the agent why', () => {
      const refused = {
        kind: 'refused',
        error: '"click" needs a target: say what the control or URL is.',
      };

      expect(readToolCall({ name: 'click', args: {} })).toEqual(refused);
      expect(readToolCall({ name: 'click', args: { target: '   ' } })).toEqual(refused);
    });

    it('does NOT type when the agent left out what to type', () => {
      expect(readToolCall({ name: 'fill', args: { target: 'Email' } })).toEqual({
        kind: 'refused',
        error: '"fill" needs a value: say what to type.',
      });
    });

    it('refuses a tool the device does not have', () => {
      expect(readToolCall({ name: 'hover', args: { target: 'Menu' } })).toEqual({
        kind: 'refused',
        error: 'There is no tool called "hover".',
      });
    });

    it('looks with no argument at all', () => {
      expect(readToolCall({ name: 'look', args: undefined })).toEqual({ kind: 'look' });
    });
  });

  describe('report', () => {
    it('files what the agent judged, trimmed, with what is optional filled in', () => {
      expect(readToolCall({ name: 'report', args: REPORT })).toEqual({
        kind: 'report',
        report: {
          step: 2,
          verdict: 'failed',
          why: 'The total is wrong',
          got: 'R$ 0,00',
          title: '',
          severity: 'medium',
          note: '',
          proof: '',
        },
      });
    });

    it('keeps the words that prove a step passed, for QAzinho to check without the agent', () => {
      expect(
        readToolCall({
          name: 'report',
          args: { ...REPORT, verdict: 'passed', proof: ' Visits: 1 ' },
        }),
      ).toMatchObject({
        kind: 'report',
        report: { verdict: 'passed', proof: 'Visits: 1' },
      });
    });

    it('keeps the bug title, the severity and the note when the agent gave them', () => {
      expect(
        readToolCall({
          name: 'report',
          args: {
            ...REPORT,
            title: 'Cart total ignores the coupon',
            severity: 'high',
            note: 'Closed a banner.',
          },
        }),
      ).toMatchObject({
        report: {
          title: 'Cart total ignores the coupon',
          severity: 'high',
          note: 'Closed a banner.',
        },
      });
    });

    it('does NOT file a verdict it does not know, and says which ones exist', () => {
      expect(
        readToolCall({ name: 'report', args: { ...REPORT, verdict: 'ok' } }),
      ).toEqual({
        kind: 'refused',
        error: '"report" needs "verdict": passed, failed or blocked.',
      });
    });

    it('does NOT file a report without a step number or a reason', () => {
      for (const args of [
        { ...REPORT, step: undefined },
        { ...REPORT, step: 0 },
        { ...REPORT, step: 1.5 },
        { ...REPORT, why: '  ' },
        undefined,
      ])
        expect(readToolCall({ name: 'report', args })).toHaveProperty('kind', 'refused');
    });

    it('asks for the severity again rather than guess it', () => {
      expect(
        readToolCall({ name: 'report', args: { ...REPORT, severity: 'huge' } }),
      ).toEqual({
        kind: 'refused',
        error: '"severity" is high, medium or low.',
      });
    });
  });

  describe('a bug on the side of a step', () => {
    const BUG = {
      title: ' Yearly price differs ',
      severity: 'medium',
      expected: 'One yearly price',
      got: '$20.49 on the page, $20.40 on the phone',
    };

    it('reads a bug the step does not ask about', () => {
      expect(readToolCall({ name: 'bug', args: BUG })).toEqual({
        kind: 'finding',
        finding: { ...BUG, title: 'Yearly price differs' },
      });
    });

    it('does NOT file a bug with nothing to know it by, and tells the agent why', () => {
      expect(readToolCall({ name: 'bug', args: { ...BUG, title: '  ' } })).toEqual({
        kind: 'refused',
        error: '"bug" needs "title": the line a developer would know the bug by.',
      });
    });
  });
});
