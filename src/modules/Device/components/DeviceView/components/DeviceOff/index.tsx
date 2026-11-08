import type { IDeviceOffProps } from './types';
import { Button, Icon, Intern } from '@/shared/components/atoms';
import './styles.css';

/** A tela do dispositivo sem nada rodando, e o que fazer com a última run. */
export const DeviceOff: React.FC<IDeviceOffProps> = ({ title, detail, mood, ended }) => (
  <div className="device-off">
    <Intern mood={mood} size={72} />
    <span className="device-off__title">{title}</span>
    {detail !== '' && <span className="device-off__detail">{detail}</span>}
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
