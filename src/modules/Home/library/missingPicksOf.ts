import type { INewProjectValues, ProjectPick } from '@/modules/Home/types';
import { webAddressOf } from '@/modules/Project/library';

/** Os cartões marcados que ainda esperam o que o QA tem de preencher. */
export function missingPicksOf(props: {
  picks: ProjectPick[];
  values: INewProjectValues;
}): ProjectPick[] {
  const { picks, values } = props;
  const isReady: Record<ProjectPick, boolean> = {
    web: webAddressOf(values.web) !== null,
    build: values.builds.length > 0,
    code: values.repositories.length > 0,
    tests: values.tests !== null,
    story: values.story !== null,
    design: values.design !== null,
    none: true,
  };

  return picks.filter((pick) => !isReady[pick]);
}
