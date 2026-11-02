import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button, Eyebrow, Icon, Intern, StatusPill } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { DeviceFocus, DeviceScreen, LiveClock, ViewportPicker } from './components';
import { useDeviceViewModel } from './hooks';
import './styles.css';

/**
 * O dispositivo que a run dirige: como está, a tela viva, o tamanho, pausar e parar, e os
 * passos que andou.
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
    screenRatio,
    onSelectViewport,
    shot,
    stream,
    urlText,
    elapsedLabel,
    isLive,
    steps,
    listedSteps,
    hasNoSteps,
    doingLabel,
    stepsWord,
    emptyStepsText,
    stepsRef,
    onStepsScroll,
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
            <span className="device-view__off-title">{t('DEVICE.NO_DEVICE')}</span>
            <span className="device-view__off-body">{t('DEVICE.NO_DEVICE_BODY')}</span>
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
            layoutId={viewportLayoutId}
            onSelect={onSelectViewport}
          />
        </div>
      )}

      <div ref={stepsRef} className="device-view__steps" onScroll={onStepsScroll}>
        <Eyebrow>
          {stepsWord} {doingLabel}
        </Eyebrow>
        {hasNoSteps && <p className="device-view__step">{emptyStepsText}</p>}
        {listedSteps.map((step) => (
          <div key={step.number} className="device-view__step">
            <StatusPill status={step.verdict} label="" />
            <span>{step.action}</span>
          </div>
        ))}
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
