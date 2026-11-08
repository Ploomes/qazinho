import type { IRunActivityProps } from '@/modules/Chat/screens/Chat/components/RunActivity/types';

export const useRunActivityViewModel = (props: IRunActivityProps) => {
  const said = props.lines.filter((line) => line.isSay === true);
  const done = props.lines.filter((line) => line.isSay !== true);

  return {
    rows: [
      ...said.map((line) => ({
        ...line,
        isNow: false,
        className: 'run-activity__line run-activity__line--say',
      })),
      ...done.map((line, index) => {
        const isNow = index === done.length - 1;

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
    ],
  };
};
