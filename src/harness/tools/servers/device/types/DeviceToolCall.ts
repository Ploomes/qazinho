import type { IStepReport } from './IStepReport';
import type { IStepAction } from '@/shared/types';

/** A tool call read against its schema: what to do with it, or what to say back to the agent. */
export type DeviceToolCall =
  | { kind: 'look' }
  | { kind: 'act'; action: IStepAction }
  | { kind: 'report'; report: IStepReport }
  | { kind: 'refused'; error: string };
