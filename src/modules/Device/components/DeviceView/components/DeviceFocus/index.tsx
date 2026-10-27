import type { IDeviceFocusProps } from './types';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { DeviceScreen } from '@/modules/Device/components/DeviceView/components/DeviceScreen';
import { LiveClock } from '@/modules/Device/components/DeviceView/components/LiveClock';
import { ViewportPicker } from '@/modules/Device/components/DeviceView/components/ViewportPicker';
import { DEVICE } from '@/modules/Device/constants';
import { Button, Eyebrow, Intern, Kbd, StatusPill } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useDeviceFocusViewModel } from './hooks';
import './styles.css';

/**
 * The device filling the app while the agent drives it, with the run beside it; Esc puts
 * it back.
 */
export const DeviceFocus: React.FC<IDeviceFocusProps> = (props) => {
  const { style, nowEyebrow, now, nowNumber, rows, hasViewports } =
    useDeviceFocusViewModel(props);
  const { t } = useTranslation();

  return (
    <motion.div
      className="device-focus"
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: MOTION.duration, ease: MOTION.ease }}
    >
      <div className="device-focus__stage">
        <motion.div
          layoutId={DEVICE.frameLayoutId}
          className={props.isPhone ? 'device-focus__phone' : 'device-focus__browser'}
          transition={{ duration: MOTION.durationSlow, ease: MOTION.ease }}
        >
          {!props.isPhone && (
            <div className="device-focus__chrome">
              <span className="device-focus__dot" />
              <span className="device-focus__dot" />
              <span className="device-focus__dot" />
              <span className="device-focus__url">{props.urlText}</span>
            </div>
          )}
          <DeviceScreen shot={props.shot} stream={props.stream} ratio={props.ratio} />
        </motion.div>
      </div>

      <motion.aside
        className="device-focus__side"
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 16 }}
        transition={{ duration: MOTION.duration, ease: MOTION.ease }}
      >
        <div className="device-focus__top">
          <span className="device-focus__state">
            <Intern mood={props.mood} size={26} isStill />
            {props.stateText}
          </span>
          <Button size="sm" variant="ghost" onClick={props.onClose}>
            {t('DEVICE.FOCUS_LEAVE')}
            <Kbd combo="Esc" />
          </Button>
        </div>

        <div className="device-focus__now">
          <span className="device-focus__now-head">
            <Eyebrow>{nowEyebrow}</Eyebrow>
            {props.isLive && <LiveClock label={props.elapsedLabel} />}
          </span>
          <p className="device-focus__now-text">
            {nowNumber !== null && (
              <span className="device-focus__now-number">{nowNumber}</span>
            )}
            {now}
          </p>
        </div>

        {hasViewports && (
          <ViewportPicker
            viewports={props.viewports}
            note={props.viewportNote}
            layoutId={DEVICE.viewportLayoutId}
            onSelect={props.onSelectViewport}
          />
        )}

        {props.hasControls && (
          <div className="device-focus__controls">
            <Button size="sm" onClick={props.onPause}>
              {props.pauseLabel}
            </Button>
            <Button size="sm" variant="danger" onClick={props.onStop}>
              {t('COMMON.STOP')}
            </Button>
          </div>
        )}

        <div className="device-focus__steps">
          <Eyebrow>
            {props.stepsWord} {props.doingLabel}
          </Eyebrow>
          {rows.map((row) => (
            <div
              key={row.number}
              className={
                row.isCurrent
                  ? 'device-focus__step device-focus__step--current'
                  : 'device-focus__step'
              }
            >
              <StatusPill status={row.verdict} label="" />
              <span>{row.action}</span>
            </div>
          ))}
        </div>
      </motion.aside>
    </motion.div>
  );
};
