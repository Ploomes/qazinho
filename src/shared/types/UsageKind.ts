/** O trabalho que uma chamada ao agente do QA pagou: o chat, um caso, um build. */
export type UsageKind =
  | 'chat'
  | 'case'
  | 'explore'
  | 'prepare'
  | 'sign-in'
  | 'assistant'
  | 'memory'
  | 'change'
  | 'build'
  | 'review'
  | 'skill';
