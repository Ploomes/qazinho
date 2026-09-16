import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button, Chip, Eyebrow, IconButton, StatusPill } from '@/components/atoms';
import { Stripes } from '@/components/molecules';
import { MOTION } from '@/constants';
import { useDevicePanelViewModel } from './hooks';
import './styles.css';

export const DevicePanel: React.FC = () => {
  const {
    isOpen,
    width,
    isPhone,
    isOff,
    stateText,
    deviceLabel,
    streamText,
    elapsedLabel,
    isLive,
    steps,
    doingLabel,
    onToggle,
    onResize,
    onPause,
    onStop,
  } = useDevicePanelViewModel();
  const { t } = useTranslation();

  if (!isOpen) {
    return (
      <button type="button" className="device-panel__rail" onClick={onToggle}>
        {t('DEVICE.RAIL')}
      </button>
    );
  }

  return (
    <motion.aside
      className="device-panel"
      animate={{ width }}
      transition={{ duration: MOTION.durationSlow, ease: MOTION.ease }}
    >
      <motion.div
        className="device-panel__handle"
        drag="x"
        dragMomentum={false}
        dragConstraints={{ left: 0, right: 0 }}
        onDrag={(_, info) => {
          onResize(width - info.delta.x);
        }}
      />

      <div className="device-panel__inner">
        <header className="device-panel__header">
          <Chip hasCaret>{deviceLabel}</Chip>
          <span className="device-panel__state">{stateText}</span>
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
          {isOff && (
            <div className="device-panel__off">
              <span>{t('DEVICE.NO_DEVICE')}</span>
              <span>{t('DEVICE.NO_DEVICE_BODY')}</span>
            </div>
          )}

          {!isOff && isPhone && (
            <div className="device-panel__phone">
              <div className="device-panel__screen">
                <Stripes pitch={11} />
                {isLive && (
                  <span className="device-panel__live">
                    <span className="device-panel__live-dot" />
                    {elapsedLabel}
                  </span>
                )}
              </div>
            </div>
          )}

          {!isOff && !isPhone && (
            <div className="device-panel__browser">
              <div className="device-panel__chrome">
                <span className="device-panel__dot" />
                <span className="device-panel__dot" />
                <span className="device-panel__dot" />
                <span className="device-panel__url">{streamText}</span>
              </div>
              <div className="device-panel__screen">
                <Stripes pitch={11} />
                {isLive && (
                  <span className="device-panel__live">
                    <span className="device-panel__live-dot" />
                    {elapsedLabel}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {!isOff && (
          <div className="device-panel__controls">
            <Button size="sm" onClick={onPause}>
              {t('COMMON.PAUSE')}
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
    </motion.aside>
  );
};
