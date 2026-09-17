import { describe, expect, it } from 'vitest';
import { actionOfToolCall } from '@/main/classes/agents/DeviceToolServer/library';

describe('actionOfToolCall', () => {
  it('turns a tool call into the action the device carries out', () => {
    expect(
      actionOfToolCall({
        name: 'fill',
        args: { target: 'Email', value: 'qa@shop.test' },
      }),
    ).toEqual({ action: { kind: 'fill', target: 'Email', value: 'qa@shop.test' } });
  });

  it('waits without a target', () => {
    expect(actionOfToolCall({ name: 'wait', args: { value: '500' } })).toEqual({
      action: { kind: 'wait', target: '', value: '500' },
    });
  });

  it('does NOT act on a control nobody named, and tells the agent why', () => {
    expect(actionOfToolCall({ name: 'click', args: {} })).toEqual({
      error: '"click" needs a target: say what the control or URL is.',
    });
  });

  it('refuses a tool the device does not have', () => {
    expect(actionOfToolCall({ name: 'hover', args: { target: 'Menu' } })).toEqual({
      error: 'There is no tool called "hover".',
    });
  });
});
