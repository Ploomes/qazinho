import type { AppToolCall } from './AppToolCall';

/** An app tool call main hands the page to carry out, and the id its answer comes back with. */
export interface IAppToolRequest {
  id: string;
  call: AppToolCall;
}
