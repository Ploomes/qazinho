import { Eyebrow, Input } from '@/components/atoms';
import { ModalFrame } from '@/components/templates';
import { useNewProjectModalViewModel } from './hooks';
import './styles.css';

export const NewProjectModal: React.FC = () => {
  const {
    name,
    url,
    apk,
    app,
    canCreate,
    androidNote,
    xcodeNote,
    isIosAvailable,
    footerHint,
    onNameChange,
    onUrlChange,
    onApkChange,
    onAppChange,
    onCancel,
    onCreate,
  } = useNewProjectModalViewModel();

  return (
    <ModalFrame
      title="New project"
      subtitle="One environment of the app you test. Add as many targets as you need."
      width={740}
      confirmLabel="Create project"
      canConfirm={canCreate}
      hint={footerHint}
      onCancel={onCancel}
      onConfirm={onCreate}
    >
      <div>
        <Eyebrow>project name</Eyebrow>
        <Input
          value={name}
          label="project name"
          placeholder="Shop · staging"
          onChange={onNameChange}
        />
      </div>

      <div>
        <Eyebrow>targets</Eyebrow>
        <div className="new-project__targets">
          <div className="new-project__target">
            <span className="new-project__target-name">Web</span>
            <p className="new-project__target-text">
              A URL the agent can reach from this machine. Basic auth and a staging cookie
              are fine.
            </p>
            <Input
              isMono
              value={url}
              label="web url"
              placeholder="https://staging.yourshop.com"
              onChange={onUrlChange}
            />
          </div>

          <div className="new-project__target">
            <span className="new-project__target-name">Android</span>
            <p className="new-project__target-text">
              Drop a debug .apk. gocrash installs it on an emulator you already have.
            </p>
            <Input
              isMono
              value={apk}
              label="android build"
              placeholder="drop your .apk here, or pick one"
              onChange={onApkChange}
            />
            <span className="new-project__note">{androidNote}</span>
          </div>

          <div
            className={
              isIosAvailable
                ? 'new-project__target'
                : 'new-project__target new-project__target--off'
            }
          >
            <span className="new-project__target-name">iOS</span>
            <p className="new-project__target-text">
              Drop a simulator build: the .app folder from DerivedData. An .ipa will not
              work, and neither will a real iPhone.
            </p>
            {isIosAvailable && (
              <Input
                isMono
                value={app}
                label="ios build"
                placeholder="drop your .app here, or pick one"
                onChange={onAppChange}
              />
            )}
            <span className="new-project__note">{xcodeNote}</span>
          </div>
        </div>
      </div>
    </ModalFrame>
  );
};
