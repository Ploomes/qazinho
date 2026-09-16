import { useTranslation } from 'react-i18next';
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
    editingKeybindId,
    integrations,
    language,
    languages,
    onSelectLanguage,
    androidSdk,
    xcode,
    idb,
    isMac,
    onBack,
    onSelectTab,
    onSelectAgent,
    onSelectModel,
    onToggleTheme,
    onToggleIntegration,
    onEditKeybind,
  } = useSettingsViewModel();
  const { t } = useTranslation();

  return (
    <section className="settings">
      <nav className="settings__nav">
        <button type="button" className="settings__back" onClick={onBack}>
          <span aria-hidden="true">←</span>
          {t('SETTINGS.BACK')}
        </button>

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
            {t(`SETTINGS.${item.toUpperCase()}` as never)}
          </button>
        ))}
      </nav>

      <div className="settings__content">
        <div className="settings__page">
          <h1 className="settings__title">
            {t(`SETTINGS.${tab.toUpperCase()}` as never)}
          </h1>

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
                      <span className="settings__row-note">
                        {t('SETTINGS.DEFAULT_AGENT')}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!item.isFound}
                        onClick={() => {
                          onSelectAgent(item.name);
                        }}
                      >
                        {item.isFound
                          ? t('SETTINGS.MAKE_DEFAULT')
                          : t('SETTINGS.NOT_ON_PATH')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <p className="settings__note">{t('SETTINGS.AGENTS_NOTE')}</p>
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
                      {item.id === model ? t('MODEL.IN_USE') : t('MODEL.USE_IT')}
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
                    {isMac ? xcode.path : t('PROJECT.IOS_MAC_ONLY')}
                  </div>
                </div>
                <span className="settings__row-action settings__row-note">
                  {isMac ? xcode.note : t('SETTINGS.IOS_OFF')}
                </span>
              </div>
              <div className="settings__row">
                <div>
                  <div className="settings__row-name">idb</div>
                  <div className="settings__row-note">
                    {isMac ? idb.path : t('PROJECT.IOS_MAC_ONLY')}
                  </div>
                </div>
                <span className="settings__row-action settings__row-note">
                  {isMac ? idb.note : t('SETTINGS.IOS_OFF')}
                </span>
              </div>
              <p className="settings__note">{t('SETTINGS.DEVICES_NOTE')}</p>
            </div>
          )}

          {tab === 'integrations' && (
            <div>
              <div className="settings__row">
                <div>
                  <div className="settings__row-name">GitHub</div>
                  <div className="settings__row-note">
                    {integrations.github
                      ? t('SETTINGS.CONNECTED')
                      : t('SETTINGS.NOT_CONNECTED')}
                  </div>
                </div>
                <div className="settings__row-action">
                  <Button
                    size="sm"
                    onClick={() => {
                      onToggleIntegration('github');
                    }}
                  >
                    {integrations.github ? t('COMMON.DISCONNECT') : t('COMMON.CONNECT')}
                  </Button>
                </div>
              </div>
              <div className="settings__row">
                <div>
                  <div className="settings__row-name">Jira</div>
                  <div className="settings__row-note">
                    {integrations.jira
                      ? t('SETTINGS.CONNECTED')
                      : t('SETTINGS.NOT_CONNECTED')}
                  </div>
                </div>
                <div className="settings__row-action">
                  <Button
                    size="sm"
                    onClick={() => {
                      onToggleIntegration('jira');
                    }}
                  >
                    {integrations.jira ? t('COMMON.DISCONNECT') : t('COMMON.CONNECT')}
                  </Button>
                </div>
              </div>
              <p className="settings__note">{t('SETTINGS.INTEGRATIONS_NOTE')}</p>
            </div>
          )}

          {tab === 'appearance' && (
            <div>
              <div className="settings__row">
                <div className="settings__row-name">{t('SETTINGS.THEME')}</div>
                <div className="settings__row-action">
                  <Button size="sm" onClick={onToggleTheme}>
                    {theme === 'dark'
                      ? t('SETTINGS.THEME_LIGHT')
                      : t('SETTINGS.THEME_DARK')}
                  </Button>
                </div>
              </div>
              <div className="settings__row">
                <div className="settings__row-name">{t('SETTINGS.LANGUAGE')}</div>
                <div className="settings__row-action">
                  {languages.map((item) => (
                    <Button
                      key={item.id}
                      size="sm"
                      disabled={item.id === language}
                      onClick={() => {
                        onSelectLanguage(item.id);
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="settings__note">{t('SETTINGS.APPEARANCE_NOTE')}</p>
            </div>
          )}

          {tab === 'shortcuts' && (
            <div>
              {keybinds.map((keybind) => (
                <div key={keybind.id} className="settings__row">
                  <div className="settings__row-name">{keybind.label}</div>
                  <div className="settings__row-action">
                    <button
                      type="button"
                      className="settings__keybind"
                      onClick={() => {
                        onEditKeybind(keybind.id);
                      }}
                    >
                      {editingKeybindId === keybind.id ? (
                        <span className="settings__row-note">
                          {t('SETTINGS.PRESS_KEYS')}
                        </span>
                      ) : (
                        <Kbd combo={keybind.combo} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'about' && (
            <div className="settings__about">
              <span className="settings__about-name">gocrash</span>
              <span className="settings__row-note">{t('SETTINGS.ABOUT_VERSION')}</span>
              <span>{t('SETTINGS.ABOUT_BY')}</span>
              <p className="settings__note">{t('SETTINGS.ABOUT_NOTE')}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
