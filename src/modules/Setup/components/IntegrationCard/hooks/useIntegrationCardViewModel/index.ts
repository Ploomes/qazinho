import type { IIntegrationCardProps } from '@/modules/Setup/components/IntegrationCard/types';
import type { IIntegrationField } from '@/modules/Setup/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connectionOf, formatDay } from '@/modules/Setup/library';
import { Integrations } from '@/services';
import { useSettingsStore, useSetupStore } from '@/store';

export const useIntegrationCardViewModel = (props: IIntegrationCardProps) => {
  const { integration } = props;
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<Partial<Record<IIntegrationField['id'], string>>>(
    {},
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const language = useSettingsStore((state) => state.language);
  const status = useSetupStore((state) =>
    state.integrations.find(({ id }) => id === integration.id),
  );
  const landIntegration = useSetupStore((state) => state.landIntegration);
  const dropIntegration = useSetupStore((state) => state.dropIntegration);

  const connection = connectionOf({ id: integration.id, values });
  const isConnected = status !== undefined;

  return {
    isConnected,
    isOpen: isOpen && !isConnected,
    isConnecting,
    error,
    text: t(integration.textKey),
    needs: t(integration.needsKey),
    pill: isConnected ? ('passed' as const) : ('idle' as const),
    statusLabel: isConnected ? t('SETUP.CONNECTED') : t('SETUP.NOT_CONNECTED'),
    action: isConnected ? t('COMMON.DISCONNECT') : t('COMMON.CONNECT'),
    connectLabel: isConnecting ? t('SETUP.CHECKING_TOKEN') : t('COMMON.CONNECT'),
    canConnect: connection !== null && !isConnecting,
    fields: integration.fields.map((field) => ({
      id: field.id,
      label: t(field.labelKey),
      placeholder: field.placeholder,
      isSecret: field.isSecret,
      value: values[field.id] ?? '',
      onChange: (value: string) => {
        setValues((typed) => ({ ...typed, [field.id]: value }));
        setError('');
      },
    })),
    rows:
      status === undefined
        ? []
        : [
            { label: t('SETUP.ROW_ACCOUNT'), value: status.account },
            ...(status.site === null
              ? []
              : [{ label: t('SETUP.ROW_SITE'), value: status.site }]),
            {
              label: t('SETUP.ROW_SINCE'),
              value: formatDay({ iso: status.connectedAt, language }),
            },
          ],
    onAction: async () => {
      if (!isConnected) {
        setIsOpen((open) => !open);

        return;
      }

      await Integrations.disconnect(integration.id);
      dropIntegration(integration.id);
    },
    onCancel: () => {
      setIsOpen(false);
      setError('');
    },
    onConnect: async () => {
      if (connection === null || isConnecting) return;

      setIsConnecting(true);
      setError('');

      const result = await Integrations.connect(connection);

      setIsConnecting(false);

      if (!result.isConnected) {
        setError(result.error);

        return;
      }

      landIntegration(result.status);
      setValues({});
      setIsOpen(false);
    },
  };
};
