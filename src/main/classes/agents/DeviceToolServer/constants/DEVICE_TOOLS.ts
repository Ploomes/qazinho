import type { IDeviceTool } from '@/main/classes/agents/DeviceToolServer/types';

/** The device, as tools the agent calls one at a time and sees the result of. */
export const DEVICE_TOOLS: IDeviceTool[] = [
  {
    name: 'look',
    description:
      'Read what the device shows right now: the visible text and the controls a person could use.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'goto',
    description:
      'Open a URL in the browser, or reopen the app from the launcher on a phone.',
    inputSchema: {
      type: 'object',
      properties: { target: { type: 'string', description: 'The URL to open.' } },
      required: ['target'],
      additionalProperties: false,
    },
  },
  {
    name: 'click',
    description:
      'Click or tap a control, named the way a person reads it: the button label, the link text, the row text.',
    inputSchema: {
      type: 'object',
      properties: { target: { type: 'string', description: 'What the control says.' } },
      required: ['target'],
      additionalProperties: false,
    },
  },
  {
    name: 'fill',
    description: 'Type into a field, named by its label, placeholder or hint.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'The field label, placeholder or hint.' },
        value: { type: 'string', description: 'What to type.' },
      },
      required: ['target', 'value'],
      additionalProperties: false,
    },
  },
  {
    name: 'press',
    description:
      'Press a key: Enter, Tab, Escape on a browser; back, home, enter, tab, delete, escape or search on a phone.',
    inputSchema: {
      type: 'object',
      properties: { target: { type: 'string', description: 'The key.' } },
      required: ['target'],
      additionalProperties: false,
    },
  },
  {
    name: 'wait',
    description: 'Wait for the device to settle, in milliseconds, before looking again.',
    inputSchema: {
      type: 'object',
      properties: {
        value: { type: 'string', description: 'Milliseconds, e.g. "1000".' },
      },
      required: ['value'],
      additionalProperties: false,
    },
  },
];
