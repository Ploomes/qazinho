import type { UserCommand } from './UserCommand';
import type { IChatAttachment } from '@/shared/types';

export interface IUserMessage {
  id: string;
  kind: 'user';
  at: string;
  text: string;
  mentions?: string[];
  command?: UserCommand;
  from?: 'agent';
  attachments?: IChatAttachment[];
}
