/** The two shapes a run asks the agent for: what to do, and how it went. */
export const RUN_SCHEMAS = {
  action: JSON.stringify({
    type: 'object',
    properties: {
      actions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            kind: { type: 'string', enum: ['goto', 'click', 'fill', 'press', 'wait'] },
            target: { type: 'string' },
            value: { type: 'string' },
          },
          required: ['kind', 'target', 'value'],
        },
      },
      note: { type: 'string' },
    },
    required: ['actions'],
  }),

  verdict: JSON.stringify({
    type: 'object',
    properties: {
      verdict: { type: 'string', enum: ['passed', 'failed', 'blocked'] },
      why: { type: 'string' },
      got: { type: 'string' },
      title: { type: 'string' },
      severity: { type: 'string', enum: ['high', 'medium', 'low'] },
    },
    required: ['verdict', 'why', 'got'],
  }),
};
