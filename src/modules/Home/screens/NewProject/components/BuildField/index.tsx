import type { IBuildFieldProps } from './types';
import { FieldCard } from '@/modules/Home/screens/NewProject/components/FieldCard';
import { Button, PlatformIcon } from '@/shared/components/atoms';
import { useBuildFieldViewModel } from './hooks';
import './styles.css';

/** O campo dos builds: um .apk para o Android e, num Mac, um .app de simulador. */
export const BuildField: React.FC<IBuildFieldProps> = (props) => {
  const view = useBuildFieldViewModel(props);

  return (
    <FieldCard
      icon="build"
      label={view.label}
      statusText={view.statusText}
      statusClassName={view.statusClassName}
    >
      <div className="build-field">
        <Button size="sm" onClick={view.onPickApk}>
          <PlatformIcon kind="android" size={14} />
          {view.apkLabel}
        </Button>
        {view.canPickApp && (
          <Button size="sm" onClick={view.onPickApp}>
            <PlatformIcon kind="ios" size={14} />
            {view.appLabel}
          </Button>
        )}
      </div>
    </FieldCard>
  );
};
