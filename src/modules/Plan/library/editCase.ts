import type { ITestCase } from '@/modules/Plan/types';
import { mapCase } from './mapCase';

export function editCase(props: {
  plan: ITestCase[];
  caseId: string;
  fields: Partial<ITestCase>;
}): ITestCase[] {
  const { plan, caseId, fields } = props;

  return mapCase({ plan, caseId, change: (testCase) => ({ ...testCase, ...fields }) });
}
