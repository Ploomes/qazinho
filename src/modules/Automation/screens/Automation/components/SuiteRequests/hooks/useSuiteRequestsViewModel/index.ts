import type { ISuiteRequestsProps } from '@/modules/Automation/screens/Automation/components/SuiteRequests/types';
import { useTranslation } from 'react-i18next';
import { SUITE_CHANGE_STATES } from '@/modules/Automation/constants';
import { requestTitleOf } from '@/modules/Automation/library';

export const useSuiteRequestsViewModel = (props: ISuiteRequestsProps) => {
  const { t } = useTranslation();

  return {
    isShown: props.requests.length > 0,
    label: t('AUTOMATION.REQUESTS'),
    rows: props.requests.map((change) => {
      const look = SUITE_CHANGE_STATES[change.status];
      const isPicked = change.id === props.pickedId;

      return {
        key: change.id,
        title: requestTitleOf(change.ask),
        icon: look.icon,
        word: t(look.writeLabelKey),
        stateClassName: `suite-requests__state suite-requests__state--${look.tone}`,
        className: isPicked
          ? 'suite-requests__row suite-requests__row--picked'
          : 'suite-requests__row',
        isPicked,
        onPick: () => {
          props.onPick(change.id);
        },
      };
    }),
  };
};
