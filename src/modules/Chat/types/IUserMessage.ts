import type { UserCommand } from './UserCommand';
import type { IChatAttachment, OutsideCaller } from '@/shared/types';

export interface IUserMessage {
  id: string;
  kind: 'user';
  duringRun?: string;
  at: string;
  text: string;
  mentions?: string[];
  command?: UserCommand;
  from?: 'agent';
  caller?: OutsideCaller;
  readAt?: string;
  attachments?: IChatAttachment[];
}
