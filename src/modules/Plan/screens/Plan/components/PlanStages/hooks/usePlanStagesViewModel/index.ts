import type { IPlanStagesProps } from '@/modules/Plan/screens/Plan/components/PlanStages/types';
import { useTranslation } from 'react-i18next';

export const usePlanStagesViewModel = (props: IPlanStagesProps) => {
  const { total, developed, how } = props;
  const { t } = useTranslation();
  const isDeveloped = total > 0 && developed >= total;
  const counts = { count: developed, total };

  return {
    stages: [
      {
        key: 'plan',
        number: 1,
        state: 'done' as const,
        label: t('PLAN.STAGE_PLAN'),
        tip: t('PLAN.STAGE_PLAN_TIP'),
      },
      {
        key: 'develop',
        number: 2,
        state:
          how === 'develop'
            ? ('live' as const)
            : isDeveloped
              ? ('done' as const)
              : ('next' as const),
        label:
          how === 'develop'
            ? t('PLAN.STAGE_DEVELOPING', counts)
            : isDeveloped
              ? t('PLAN.STAGE_DEVELOPED')
              : developed > 0
                ? t('PLAN.STAGE_PARTIAL', counts)
                : t('PLAN.STAGE_DEVELOP'),
        tip: t('PLAN.STAGE_DEVELOP_TIP'),
      },
      {
        key: 'run',
        number: 3,
        state:
          how === 'replay' || how === 'adjust'
            ? ('live' as const)
            : isDeveloped
              ? ('next' as const)
              : ('later' as const),
        label:
          how === 'replay' || how === 'adjust'
            ? t('PLAN.STAGE_RUNNING')
            : t('PLAN.STAGE_RUN'),
        tip: t('PLAN.STAGE_RUN_TIP'),
      },
    ],
  };
};
