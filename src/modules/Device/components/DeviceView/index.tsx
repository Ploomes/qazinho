import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button, Eyebrow, Icon, Intern, StatusPill } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { DeviceFocus, DeviceScreen, LiveClock, ViewportPicker } from './components';
import { useDeviceViewModel } from './hooks';
import './styles.css';

/**
 * The device the run drives: how it stands, its live screen, its size, pause and stop,
 * and the steps it walked.
 */
export const DeviceView: React.FC = () => {
  const {
    isFocused,
    canFocus,
    focusLabel,
    focusedText,
    frameLayoutId,
    frameTransition,
    onFocus,
    onUnfocus,
    style,
    isPhone,
    hasScreen,
    viewportClassName,
    hasControls,
    pauseLabel,
    stateText,
    mood,
    viewports,
    hasViewportPicker,
    viewportLayoutId,
    viewportNote,
    screenRatio,
    onSelectViewport,
    shot,
    stream,
    urlText,
    elapsedLabel,
    isLive,
    steps,
    doingLabel,
    stepsWord,
    emptyStepsText,
    onPause,
    onStop,
  } = useDeviceViewModel();
  const { t } = useTranslation();

  return (
    <div className="device-view" style={style}>
      <header className="device-view__header">
        <span className="device-view__state">
          <Intern mood={mood} size={22} isStill />
          <span className="device-view__state-text">{stateText}</span>
          {isLive && <LiveClock label={elapsedLabel} />}
        </span>
        <span className="device-view__collapse">
          <AnimatePresence initial={false}>
            {canFocus && (
              <motion.span
                key="focus"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
              >
                <Button size="sm" variant="secondary" onClick={onFocus}>
                  <Icon name="focus" />
                  <span className="device-view__focus-label">{focusLabel}</span>
                </Button>
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </header>

      <div className={viewportClassName}>
        {!hasScreen && (
          <div className="device-view__off">
            <Intern mood="sleeping" size={72} />
            <span>{t('DEVICE.NO_DEVICE')}</span>
            <span>{t('DEVICE.NO_DEVICE_BODY')}</span>
          </div>
        )}

        {hasScreen && isFocused && <p className="device-view__focused">{focusedText}</p>}

        {hasScreen && !isFocused && isPhone && (
          <motion.div
            layoutId={frameLayoutId}
            transition={frameTransition}
            className="device-view__phone"
          >
            <DeviceScreen shot={shot} stream={stream} ratio={screenRatio} />
          </motion.div>
        )}

        {hasScreen && !isFocused && !isPhone && (
          <motion.div
            layoutId={frameLayoutId}
            transition={frameTransition}
            className="device-view__browser"
          >
            <div className="device-view__chrome">
              <span className="device-view__dot" />
              <span className="device-view__dot" />
              <span className="device-view__dot" />
              <span className="device-view__url">{urlText}</span>
            </div>
            <DeviceScreen shot={shot} stream={stream} ratio={screenRatio} />
          </motion.div>
        )}
      </div>

      {hasViewportPicker && (
        <div className="device-view__size">
          <ViewportPicker
            viewports={viewports}
            note={viewportNote}
            layoutId={viewportLayoutId}
            onSelect={onSelectViewport}
          />
        </div>
      )}

      {hasControls && (
        <div className="device-view__controls">
          <Button size="sm" onClick={onPause}>
            {pauseLabel}
          </Button>
          <Button size="sm" variant="danger" onClick={onStop}>
            {t('COMMON.STOP')}
          </Button>
        </div>
      )}

      <div className="device-view__steps">
        <Eyebrow>
          {stepsWord} {doingLabel}
        </Eyebrow>
        {steps.length === 0 ? (
          <p className="device-view__step">{emptyStepsText}</p>
        ) : (
          steps.map((step) => (
            <div key={step.number} className="device-view__step">
              <StatusPill status={step.verdict} label="" />
              <span>{step.action}</span>
            </div>
          ))
        )}
      </div>
      {createPortal(
        <AnimatePresence>
          {isFocused && (
            <DeviceFocus
              key="focus"
              isPhone={isPhone}
              shot={shot}
              stream={stream}
              isLive={isLive}
              elapsedLabel={elapsedLabel}
              urlText={urlText}
              stateText={stateText}
              mood={mood}
              steps={steps}
              doingLabel={doingLabel}
              stepsWord={stepsWord}
              hasControls={hasControls}
              pauseLabel={pauseLabel}
              viewports={viewports}
              viewportNote={viewportNote}
              ratio={screenRatio}
              onSelectViewport={onSelectViewport}
              onPause={onPause}
              onStop={onStop}
              onClose={onUnfocus}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
};
