import type { IDeviceScreenProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { MOTION } from '@/constants';
import './styles.css';

export const DeviceScreen: React.FC<IDeviceScreenProps> = (props) => {
  const { shot, isLive, elapsedLabel } = props;
  const { t } = useTranslation();

  return (
    <div className="device-screen">
      <AnimatePresence initial={false} mode="popLayout">
        {shot === null ? (
          <p className="device-screen__waiting">{t('DEVICE.NO_SHOT')}</p>
        ) : (
          <motion.img
            key={shot.slice(-32)}
            className="device-screen__shot"
            src={shot}
            alt={t('DEVICE.SHOT_ALT')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          />
        )}
      </AnimatePresence>

      {isLive && (
        <span className="device-screen__live">
          <span className="device-screen__live-dot" />
          {elapsedLabel}
        </span>
      )}
    </div>
  );
};
