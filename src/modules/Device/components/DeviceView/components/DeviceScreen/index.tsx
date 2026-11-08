import type { IDeviceScreenProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { MOTION } from '@/shared/constants';
import { BugFlash } from './components';
import { useDeviceScreenViewModel } from './hooks';
import './styles.css';

export const DeviceScreen: React.FC<IDeviceScreenProps> = (props) => {
  const { shot, stream } = props;
  const { className, style, workspaceId } = useDeviceScreenViewModel(props);
  const { t } = useTranslation();

  return (
    <div className={className} style={style}>
      <AnimatePresence initial={false} mode="popLayout">
        {stream !== null ? (
          <img
            key="stream"
            className="device-screen__stream"
            src={stream}
            alt={t('DEVICE.SHOT_ALT')}
          />
        ) : shot === null ? (
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
      <BugFlash workspaceId={workspaceId} />
    </div>
  );
};
