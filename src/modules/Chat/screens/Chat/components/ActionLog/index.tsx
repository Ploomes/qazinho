import type { IActionLogProps } from './types';
import { useTranslation } from 'react-i18next';
import { Eyebrow } from '@/components/atoms';
import './styles.css';

export const ActionLog: React.FC<IActionLogProps> = (props) => {
  const { t } = useTranslation();

  return (
    <div className="action-log">
      <Eyebrow>
        {t('CHAT.ACTIONS_ON_DEVICE', { count: props.message.actions.length })}
      </Eyebrow>
      {props.message.actions.map((action) => (
        <div key={`${action.at}-${action.what}`} className="action-log__row">
          <span aria-hidden="true">›</span>
          <span>{action.what}</span>
          <span className="action-log__at">{action.at}</span>
        </div>
      ))}
    </div>
  );
};
