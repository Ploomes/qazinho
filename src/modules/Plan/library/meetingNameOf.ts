import { MEETING_NAME } from '@/modules/Plan/constants';

/** O nome de uma reunião colada: a primeira linha, quando é um título, ou o de reserva. */
export function meetingNameOf(props: { text: string; fallback: string }): string {
  const first =
    props.text
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .find((line) => line !== '') ?? '';

  if (
    first === '' ||
    first.length > MEETING_NAME.longest ||
    MEETING_NAME.speech.test(first)
  )
    return props.fallback;

  return first;
}
