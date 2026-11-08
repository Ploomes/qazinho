import type { IRunActivityProps } from '@/modules/Chat/screens/Chat/components/RunActivity/types';

export const useRunActivityViewModel = (props: IRunActivityProps) => ({
  rows: props.lines.map((line, index) => {
    const isNow = index === props.lines.length - 1;

    return {
      ...line,
      isNow,
      className: [
        'run-activity__line',
        ...(isNow ? ['run-activity__line--now'] : []),
        ...(line.isBug ? ['run-activity__line--bug'] : []),
      ].join(' '),
    };
  }),
});
