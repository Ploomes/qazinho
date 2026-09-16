import { Button, Kbd } from '@/components/atoms';
import { useSettingsViewModel } from './hooks';
import './styles.css';

export const Settings: React.FC = () => {
  const {
    tabs,
    tab,
    theme,
    agents,
    agent,
    models,
    model,
    keybinds,
    integrations,
    androidSdk,
    xcode,
    isMac,
    onSelectTab,
    onSelectAgent,
    onSelectModel,
    onToggleTheme,
    onToggleIntegration,
  } = useSettingsViewModel();

  return (
    <section className="settings">
      <nav className="settings__nav">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            className={
              item === tab
                ? 'settings__nav-item settings__nav-item--active'
                : 'settings__nav-item'
            }
            onClick={() => {
              onSelectTab(item);
            }}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="settings__content">
        <h1 className="settings__title">{tab}</h1>

        {tab === 'agents' && (
          <div>
            {agents.map((item) => (
              <div key={item.name} className="settings__row">
                <div>
                  <div className="settings__row-name">{item.name}</div>
                  <div className="settings__row-note">{item.path}</div>
                </div>
                <div className="settings__row-action">
                  {item.name === agent ? (
                    <span className="settings__row-note">Default agent</span>
                  ) : (
                    <Button
                      size="sm"
                      disabled={!item.isFound}
                      onClick={() => {
                        onSelectAgent(item.name);
                      }}
                    >
                      {item.isFound ? 'Make default' : 'Not on PATH'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <p className="settings__note">
              gocrash has no model of its own. It drives whichever agent you already have
              installed.
            </p>
            {models.map((item) => (
              <div key={item.id} className="settings__row">
                <div>
                  <div className="settings__row-name">{item.name}</div>
                  <div className="settings__row-note">{item.note}</div>
                </div>
                <div className="settings__row-action">
                  <Button
                    size="sm"
                    disabled={item.isLocked}
                    onClick={() => {
                      onSelectModel(item.id);
                    }}
                  >
                    {item.id === model ? 'in use' : 'use it'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'devices' && (
          <div>
            <div className="settings__row">
              <div>
                <div className="settings__row-name">Android SDK</div>
                <div className="settings__row-note">{androidSdk.path}</div>
              </div>
              <span className="settings__row-action settings__row-note">
                {androidSdk.note}
              </span>
            </div>
            <div className="settings__row">
              <div>
                <div className="settings__row-name">Xcode</div>
                <div className="settings__row-note">
                  {isMac ? xcode.path : 'macOS only'}
                </div>
              </div>
              <span className="settings__row-action settings__row-note">
                {isMac ? xcode.note : 'iOS targets are off'}
              </span>
            </div>
            <p className="settings__note">
              gocrash never downloads an SDK, an emulator or Xcode. It finds what is
              already here and says what is missing.
            </p>
          </div>
        )}

        {tab === 'integrations' && (
          <div>
            <div className="settings__row">
              <div>
                <div className="settings__row-name">GitHub</div>
                <div className="settings__row-note">
                  {integrations.github ? 'connected' : 'not connected'}
                </div>
              </div>
              <div className="settings__row-action">
                <Button
                  size="sm"
                  onClick={() => {
                    onToggleIntegration('github');
                  }}
                >
                  {integrations.github ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            </div>
            <div className="settings__row">
              <div>
                <div className="settings__row-name">Jira</div>
                <div className="settings__row-note">
                  {integrations.jira ? 'connected' : 'not connected'}
                </div>
              </div>
              <div className="settings__row-action">
                <Button
                  size="sm"
                  onClick={() => {
                    onToggleIntegration('jira');
                  }}
                >
                  {integrations.jira ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            </div>
            <p className="settings__note">
              Nothing is sent anywhere on its own. You pick the run, the bug and the
              moment.
            </p>
          </div>
        )}

        {tab === 'appearance' && (
          <div>
            <div className="settings__row">
              <div className="settings__row-name">Theme</div>
              <div className="settings__row-action">
                <Button size="sm" onClick={onToggleTheme}>
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </Button>
              </div>
            </div>
            <p className="settings__note">
              Every status carries an icon and a word, so colour is never the only clue.
            </p>
          </div>
        )}

        {tab === 'shortcuts' && (
          <div>
            {keybinds.map((keybind) => (
              <div key={keybind.id} className="settings__row">
                <div className="settings__row-name">{keybind.label}</div>
                <div className="settings__row-action">
                  <Kbd combo={keybind.combo} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'about' && (
          <div className="settings__about">
            <span className="settings__about-name">gocrash</span>
            <span className="settings__row-note">0.1.0 · MIT</span>
            <span>by Salve Software</span>
            <p className="settings__note">
              Go crash your app before your users do. Your agent, your emulators, your
              screenshots. Nothing leaves this machine.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
