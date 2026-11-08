import { LIVE_STREAM } from '@/main/classes/devices/LiveStream/constants';

/** A chave da transmissão de um workspace, ou de uma das telas abertas nele. */
export function streamKeyOf(props: { workspaceId: string; screen?: number }): string {
  return props.screen === undefined
    ? props.workspaceId
    : `${props.workspaceId}${LIVE_STREAM.screenMark}${String(props.screen)}`;
}
