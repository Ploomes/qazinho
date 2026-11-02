import { IntegrationCard } from '@/modules/Setup/components';
import { INTEGRATIONS } from '@/modules/Setup/constants';
import './styles.css';

export const StepIntegrations: React.FC = () => {
  return (
    <div className="step-integrations">
      {INTEGRATIONS.map((item) => (
        <IntegrationCard key={item.id} integration={item} />
      ))}
    </div>
  );
};
