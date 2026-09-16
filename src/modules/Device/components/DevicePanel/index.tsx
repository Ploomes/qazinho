import { motion } from 'motion/react';
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

  if (!isOpen) {
    return (
      <button type="button" className="device-panel__rail" onClick={onToggle}>
        |← device
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
            <IconButton glyph="→|" label="Hide the device" size="sm" onClick={onToggle} />
          </span>
        </header>

        <div className="device-panel__viewport">
          {isOff && (
            <div className="device-panel__off">
              <span>no device yet</span>
              <span>Hit Run plan and the device opens right here.</span>
            </div>
          )}

          {!isOff && isPhone && (
            <div className="device-panel__phone">
              <div className="device-panel__screen">
                <Stripes pitch={11} />
                {isLive && (
                  <span className="device-panel__live">
                    <span className="device-panel__live-dot" />
                    live · {elapsedLabel}
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
                    live · {elapsedLabel}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {!isOff && (
          <div className="device-panel__controls">
            <Button size="sm" onClick={onPause}>
              Pause
            </Button>
            <Button size="sm" variant="danger" onClick={onStop}>
              Stop
            </Button>
          </div>
        )}

        <div className="device-panel__steps">
          <Eyebrow>steps {doingLabel}</Eyebrow>
          {steps.length === 0 ? (
            <p className="device-panel__step">
              Hit Run plan and the steps show up here, one at a time.
            </p>
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
