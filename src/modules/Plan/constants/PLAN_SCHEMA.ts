/** The shape the agent must answer in when it drafts a plan. The CLI enforces it. */
export const PLAN_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    summary: { type: 'string' },
    cases: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          priority: { type: 'string', enum: ['P1', 'P2', 'P3'] },
          goal: { type: 'string' },
          preconditions: { type: 'string' },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                action: { type: 'string' },
                expected: { type: 'string' },
              },
              required: ['action', 'expected'],
            },
          },
        },
        required: ['title', 'priority', 'goal', 'preconditions', 'steps'],
      },
    },
  },
  required: ['summary', 'cases'],
});
