import { useTranslation } from 'react-i18next';
import { IntegrationCard } from '@/modules/Setup/components';
import { INTEGRATIONS } from '@/modules/Setup/constants';
import './styles.css';

export const StepIntegrations: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="step-integrations">
      {INTEGRATIONS.map((item) => (
        <IntegrationCard key={item.id} integration={item} />
      ))}
      <p className="step-integrations__note">{t('SETTINGS.INTEGRATIONS_NOTE')}</p>
    </div>
  );
};
