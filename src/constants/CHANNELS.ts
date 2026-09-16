/** The only channels that exist. The preload names them; the page never sees one. */
export const CHANNELS = {
  detectAgents: 'agents:detect',
  readResources: 'resources:read',
  detectDeviceTools: 'devices:detect',
  askAgent: 'agent:ask',
  agentEvent: 'agent:event',
  startRun: 'run:start',
  stopRun: 'run:stop',
  runEvent: 'run:event',
} as const;
