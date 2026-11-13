import type { IDeviceScreenProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { releaseStream } from '@/modules/Device/library';
import { MOTION } from '@/shared/constants';
import { BugFlash } from './components';
import { useDeviceScreenViewModel } from './hooks';
import './styles.css';

/**
 * A tela do dispositivo: o stream vivo ou a última tela, e, na vez do QA num caso à mão,
 * uma superfície que leva o clique, a rolagem e o teclado dele ao dispositivo.
 */
export const DeviceScreen: React.FC<IDeviceScreenProps> = (props) => {
  const { shot, stream } = props;
  const {
    className,
    style,
    workspaceId,
    surfaceStream,
    touchLabel,
    onStreamLoad,
    onPointerDown,
    onPointerUp,
    onWheel,
    onKeyDown,
  } = useDeviceScreenViewModel(props);
  const { t } = useTranslation();

  return (
    <div className={className} style={style}>
      <AnimatePresence initial={false} mode="popLayout">
        {surfaceStream !== null ? (
          <div
            key="surface"
            className="device-screen__surface"
            role="application"
            aria-label={touchLabel}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onWheel={onWheel}
            onKeyDown={onKeyDown}
          >
            <img
              ref={releaseStream}
              className="device-screen__stream device-screen__stream--fill"
              src={surfaceStream}
              alt={t('DEVICE.SHOT_ALT')}
              draggable={false}
              onLoad={onStreamLoad}
            />
          </div>
        ) : stream !== null ? (
          <img
            key="stream"
            ref={releaseStream}
            className="device-screen__stream"
            src={stream}
            alt={t('DEVICE.SHOT_ALT')}
            onLoad={onStreamLoad}
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
