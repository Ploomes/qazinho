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
    },
    required: ['actions'],
  }),

  verdict: JSON.stringify({
    type: 'object',
    properties: {
      verdict: { type: 'string', enum: ['passed', 'failed', 'blocked'] },
      why: { type: 'string' },
      got: { type: 'string' },
    },
    required: ['verdict', 'why', 'got'],
  }),
};
