import type { IDeviceStep } from '@/modules/Device/types';

/** Os passos em ordem, agrupados no caso de cada um; sem caso, um grupo só sem título. */
export function stepSectionsOf(
  steps: IDeviceStep[],
): { key: string; title: string; rows: IDeviceStep[] }[] {
  return steps.reduce<{ key: string; title: string; rows: IDeviceStep[] }[]>(
    (sections, step) => {
      const key = step.caseId ?? '';
      const open = sections.at(-1);

      if (open?.key === key) {
        open.rows.push(step);

        return sections;
      }

      return [...sections, { key, title: step.caseTitle ?? '', rows: [step] }];
    },
    [],
  );
}
