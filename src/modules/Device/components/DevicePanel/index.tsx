import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Eyebrow,
  IconButton,
  Intern,
  StatusPill,
} from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { DeviceFocus, DeviceScreen, LiveClock, ViewportPicker } from './components';
import { useDevicePanelViewModel } from './hooks';
import './styles.css';

export const DevicePanel: React.FC = () => {
  const {
    isOpen,
    isFocused,
    canFocus,
    focusLabel,
    focusedText,
    frameLayoutId,
    frameTransition,
    onFocus,
    onUnfocus,
    width,
    panelWidth,
    widthTransition,
    panelStyle,
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
      style={panelStyle}
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

            <div className="device-panel__inner">
              <header className="device-panel__header">
                <span className="device-panel__state">
                  <Intern mood={mood} size={22} isStill />
                  <span className="device-panel__state-text">{stateText}</span>
                  {isLive && <LiveClock label={elapsedLabel} />}
                </span>
                <span className="device-panel__collapse">
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
                          <span aria-hidden="true">⤢</span>
                          {focusLabel}
                        </Button>
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <IconButton
                    glyph="→|"
                    label={t('DEVICE.HIDE')}
                    size="sm"
                    onClick={onToggle}
                  />
                </span>
              </header>

              <div className={viewportClassName}>
                {!hasScreen && (
                  <div className="device-panel__off">
                    <Intern mood="sleeping" size={72} />
                    <span>{t('DEVICE.NO_DEVICE')}</span>
                    <span>{t('DEVICE.NO_DEVICE_BODY')}</span>
                  </div>
                )}

                {hasScreen && isFocused && (
                  <p className="device-panel__focused">{focusedText}</p>
                )}

                {hasScreen && !isFocused && isPhone && (
                  <motion.div
                    layoutId={frameLayoutId}
                    transition={frameTransition}
                    className="device-panel__phone"
                  >
                    <DeviceScreen shot={shot} stream={stream} ratio={screenRatio} />
                  </motion.div>
                )}

                {hasScreen && !isFocused && !isPhone && (
                  <motion.div
                    layoutId={frameLayoutId}
                    transition={frameTransition}
                    className="device-panel__browser"
                  >
                    <div className="device-panel__chrome">
                      <span className="device-panel__dot" />
                      <span className="device-panel__dot" />
                      <span className="device-panel__dot" />
                      <span className="device-panel__url">{urlText}</span>
                    </div>
                    <DeviceScreen shot={shot} stream={stream} ratio={screenRatio} />
                  </motion.div>
                )}
              </div>

              {hasViewportPicker && (
                <div className="device-panel__size">
                  <ViewportPicker
                    viewports={viewports}
                    note={viewportNote}
                    layoutId={viewportLayoutId}
                    onSelect={onSelectViewport}
                  />
                </div>
              )}

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
    </motion.aside>
  );
};
