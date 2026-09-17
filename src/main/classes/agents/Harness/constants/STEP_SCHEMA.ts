/** How the agent reports a step it carried out on the device itself. */
export const STEP_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['passed', 'failed', 'blocked'] },
    why: { type: 'string' },
    got: { type: 'string' },
    title: { type: 'string' },
    severity: { type: 'string', enum: ['high', 'medium', 'low'] },
    note: { type: 'string' },
  },
  required: ['verdict', 'why', 'got'],
});
