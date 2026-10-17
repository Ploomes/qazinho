import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Chip,
  Eyebrow,
  IconButton,
  Intern,
  StatusPill,
} from '@/components/atoms';
import { MOTION } from '@/constants';
import { DeviceScreen } from './components';
import { useDevicePanelViewModel } from './hooks';
import './styles.css';

export const DevicePanel: React.FC = () => {
  const {
    isOpen,
    width,
    panelWidth,
    widthTransition,
    innerStyle,
    isPhone,
    hasScreen,
    hasControls,
    pauseLabel,
    stateText,
    mood,
    deviceLabel,
    shot,
    stream,
    urlText,
    elapsedLabel,
    isLive,
    steps,
    doingLabel,
    onToggle,
    onResize,
    onResizeStart,
    onResizeEnd,
    onPause,
    onStop,
  } = useDevicePanelViewModel();
  const { t } = useTranslation();

  return (
    <motion.aside
      className="device-panel"
      initial={false}
      animate={{ width: panelWidth }}
      transition={widthTransition}
    >
      <AnimatePresence initial={false}>
        {!isOpen && (
          <motion.button
            key="rail"
            type="button"
            className="device-panel__rail"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: MOTION.duration, delay: 0.08 },
            }}
            exit={{ opacity: 0, transition: { duration: MOTION.durationFast } }}
            onClick={onToggle}
          >
            {t('DEVICE.RAIL')}
          </motion.button>
        )}

        {isOpen && (
          <motion.div
            key="panel"
            className="device-panel__open"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: MOTION.duration, delay: 0.08 },
            }}
            exit={{ opacity: 0, transition: { duration: MOTION.durationFast } }}
          >
            <motion.div
              className="device-panel__handle"
              drag="x"
              dragMomentum={false}
              dragElastic={0}
              dragConstraints={{ left: 0, right: 0 }}
              onDragStart={onResizeStart}
              onDragEnd={onResizeEnd}
              onDrag={(_, info) => {
                onResize(width - info.delta.x);
              }}
            />

            <div className="device-panel__inner" style={innerStyle}>
              <header className="device-panel__header">
                <Chip hasCaret>{deviceLabel}</Chip>
                <span className="device-panel__state">
                  <Intern mood={mood} size={22} />
                  {stateText}
                </span>
                <span className="device-panel__collapse">
                  <IconButton
                    glyph="→|"
                    label={t('DEVICE.HIDE')}
                    size="sm"
                    onClick={onToggle}
                  />
                </span>
              </header>

              <div className="device-panel__viewport">
                {!hasScreen && (
                  <div className="device-panel__off">
                    <Intern mood="sleeping" size={72} />
                    <span>{t('DEVICE.NO_DEVICE')}</span>
                    <span>{t('DEVICE.NO_DEVICE_BODY')}</span>
                  </div>
                )}

                {hasScreen && isPhone && (
                  <div className="device-panel__phone">
                    <DeviceScreen
                      shot={shot}
                      stream={stream}
                      isLive={isLive}
                      elapsedLabel={elapsedLabel}
                    />
                  </div>
                )}

                {hasScreen && !isPhone && (
                  <div className="device-panel__browser">
                    <div className="device-panel__chrome">
                      <span className="device-panel__dot" />
                      <span className="device-panel__dot" />
                      <span className="device-panel__dot" />
                      <span className="device-panel__url">{urlText}</span>
                    </div>
                    <DeviceScreen
                      shot={shot}
                      stream={stream}
                      isLive={isLive}
                      elapsedLabel={elapsedLabel}
                    />
                  </div>
                )}
              </div>

              {hasControls && (
                <div className="device-panel__controls">
                  <Button size="sm" onClick={onPause}>
                    {pauseLabel}
                  </Button>
                  <Button size="sm" variant="danger" onClick={onStop}>
                    {t('COMMON.STOP')}
                  </Button>
                </div>
              )}

              <div className="device-panel__steps">
                <Eyebrow>
                  {t('DEVICE.STEPS')} {doingLabel}
                </Eyebrow>
                {steps.length === 0 ? (
                  <p className="device-panel__step">{t('DEVICE.STEPS_EMPTY')}</p>
                ) : (
                  steps.map((step) => (
                    <div key={step.number} className="device-panel__step">
                      <StatusPill status={step.verdict} label="" />
                      <span>{step.action}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};
