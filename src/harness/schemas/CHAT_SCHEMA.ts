const PLAN = {
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
              properties: { action: { type: 'string' }, expected: { type: 'string' } },
              required: ['action', 'expected'],
            },
          },
        },
        required: ['title', 'priority', 'goal', 'preconditions', 'steps'],
      },
    },
  },
  required: ['summary', 'cases'],
};

export const CHAT_SCHEMA = JSON.stringify({
  type: 'object',
  properties: { reply: { type: 'string' }, plan: PLAN },
  required: ['reply'],
});
