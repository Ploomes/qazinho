import type { IDeviceOffProps } from './types';
import { Button, Icon, Intern } from '@/shared/components/atoms';
import { Screenshot } from '@/shared/components/molecules';
import './styles.css';

/** A tela sem nada rodando: a última tela da última run, ou o que fazer com ela. */
export const DeviceOff: React.FC<IDeviceOffProps> = ({
  title,
  detail,
  mood,
  ended,
  start,
  shot,
}) =>
  shot !== undefined && shot !== null ? (
    <div className="device-off device-off--shot">
      <Screenshot
        size="hero"
        label={shot.label}
        src={shot.src}
        file={shot.file}
        onOpen={shot.onOpen}
      />
    </div>
  ) : (
    <div className="device-off">
      <Intern mood={mood} size={72} />
      <span className="device-off__title">{title}</span>
      {detail !== '' && <span className="device-off__detail">{detail}</span>}
      {start !== null && (
        <Button variant="secondary" onClick={start.onStart}>
          {start.label}
        </Button>
      )}
      {ended !== null && (
        <div className="device-off__actions">
          {ended.canWatch && (
            <Button onClick={ended.onWatch}>
              <Icon name="play" /> {ended.watchLabel}
            </Button>
          )}
          <Button variant="ghost" onClick={ended.onOpenRuns}>
            {ended.runsLabel}
          </Button>
        </div>
      )}
    </div>
  );
