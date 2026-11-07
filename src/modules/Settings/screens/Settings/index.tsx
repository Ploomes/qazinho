import { AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  AgentSignIn,
  InstallProgress,
  IntegrationCard,
  McpCard,
  OutsideServerCard,
  ToolCard,
} from '@/modules/Setup';
import { Button, Icon, Logo, Switch, Tag, Wordmark } from '@/shared/components/atoms';
import { StorageSettings } from './components';
import { useSettingsViewModel } from './hooks';
import './styles.css';

export const Settings: React.FC = () => {
  const {
    tab,
    title,
    tabs,
    agents,
    devices,
    needsNpm,
    nodeUrl,
    needsBrew,
    brewUrl,
    onInstallIdb,
    integrations,
    mcpServers,
    themes,
    languages,
    runAlerts,
    keybinds,
    openLogsLabel,
    copyDiagnosticsLabel,
    onOpenLogs,
    onCopyDiagnostics,
    version,
    rights,
    signIn,
    signInAgent,
    onCancelSignIn,
    onCloseSignIn,
    onRetrySignIn,
    onBack,
    onSelectTab,
    onSelectAgent,
    onSelectTheme,
    onSelectLanguage,
    onSelectRunAlert,
    islandLabel,
    isIslandOn,
    onIslandChange,
    onEditKeybind,
  } = useSettingsViewModel();
  const { t } = useTranslation();

  return (
    <section className="settings">
      <nav className="settings__nav">
        <button type="button" className="settings__back" onClick={onBack}>
          <Icon name="back" />
          {t('SETTINGS.BACK')}
        </button>

        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              item.isActive
                ? 'settings__nav-item settings__nav-item--active'
                : 'settings__nav-item'
            }
            onClick={() => {
              onSelectTab(item.id);
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="settings__content">
        <div className="settings__page">
          <h1 className="settings__title">{title}</h1>

          {tab === 'agents' && (
            <div className="settings__stack">
              {agents.map((item) => (
                <div key={item.name} className="settings__agent">
                  <button
                    type="button"
                    className={item.className}
                    disabled={!item.isFound}
                    onClick={() => {
                      onSelectAgent(item.name);
                    }}
                  >
                    <span
                      className={
                        item.isFound
                          ? 'settings__dot settings__dot--found'
                          : 'settings__dot'
                      }
                    />
                    <span className="settings__card-text">
                      <span
                        className={
                          item.isFound
                            ? 'settings__card-name'
                            : 'settings__card-name settings__card-name--muted'
                        }
                      >
                        {item.name}
                      </span>
                      <span className="settings__card-path" title={item.path}>
                        {item.path}
                      </span>
                    </span>
                    <span
                      className={
                        item.isFound
                          ? 'settings__card-note'
                          : 'settings__card-note settings__card-note--missing'
                      }
                    >
                      {item.note}
                    </span>
                  </button>
                  {item.canSignIn && (
                    <span className="settings__agent-sign-in">
                      <Button size="sm" variant="primary" onClick={item.onSignIn}>
                        {t('SETUP.SIGN_IN')}
                      </Button>
                    </span>
                  )}
                  {item.canInstall && (
                    <span className="settings__agent-sign-in">
                      <Button size="sm" variant="primary" onClick={item.onInstall}>
                        {t('SETUP.INSTALL')}
                      </Button>
                    </span>
                  )}
                  <AnimatePresence initial={false}>
                    {item.install !== null && (
                      <InstallProgress
                        key="install"
                        state={item.install}
                        onRetry={item.onInstall}
                      />
                    )}
                  </AnimatePresence>
                </div>
              ))}
              {needsNpm && (
                <p className="settings__note">
                  {t('SETUP.NEEDS_NPM')}{' '}
                  <a
                    className="settings__link"
                    href={nodeUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    nodejs.org <Icon name="external" />
                  </a>
                </p>
              )}
            </div>
          )}

          {tab === 'devices' && (
            <div className="settings__stack">
              {devices.map((item) => (
                <ToolCard
                  key={item.name}
                  name={item.name}
                  detail={item.detail}
                  state={item.state}
                  badge={item.badge}
                  action={
                    <>
                      {item.hasLink && (
                        <a
                          className="settings__get"
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.linkLabel} <Icon name="external" />
                        </a>
                      )}
                      {item.canInstall && (
                        <Button size="sm" variant="primary" onClick={onInstallIdb}>
                          {t('SETUP.INSTALL')}
                        </Button>
                      )}
                    </>
                  }
                >
                  <AnimatePresence initial={false}>
                    {item.install !== null && (
                      <InstallProgress
                        key="install"
                        state={item.install}
                        onRetry={onInstallIdb}
                      />
                    )}
                  </AnimatePresence>
                </ToolCard>
              ))}
              {needsBrew && (
                <p className="settings__note">
                  {t('SETUP.NEEDS_BREW')}{' '}
                  <a
                    className="settings__link"
                    href={brewUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    brew.sh <Icon name="external" />
                  </a>
                </p>
              )}
            </div>
          )}

          {tab === 'integrations' && (
            <div className="settings__stack">
              {integrations.map((item) => (
                <IntegrationCard key={item.id} integration={item} />
              ))}
            </div>
          )}

          {tab === 'mcps' && (
            <div className="settings__stack">
              {mcpServers.map((item) => (
                <McpCard key={item.id} server={item} />
              ))}
              <OutsideServerCard />
            </div>
          )}

          {tab === 'appearance' && (
            <div className="settings__stack settings__stack--wide">
              <div className="settings__themes">
                {themes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      item.isActive
                        ? 'settings__theme settings__theme--on'
                        : 'settings__theme'
                    }
                    style={item.swatch}
                    onClick={() => {
                      onSelectTheme(item.id);
                    }}
                  >
                    <span className="settings__swatch">
                      <span className="settings__swatch-bar" />
                      <span className="settings__swatch-accent" />
                    </span>
                    <span className="settings__theme-label">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="settings__section">
                <span className="settings__eyebrow">{t('SETTINGS.LANGUAGE')}</span>
                <div className="settings__languages">
                  {languages.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={
                        item.isActive
                          ? 'settings__language settings__language--on'
                          : 'settings__language'
                      }
                      onClick={() => {
                        onSelectLanguage(item.id);
                      }}
                    >
                      <span className="settings__language-label">{item.label}</span>
                      <span className="settings__language-code">{item.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings__section">
                <span className="settings__eyebrow">{t('SETTINGS.RUN_ALERT')}</span>
                <div className="settings__choices">
                  {runAlerts.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={item.className}
                      onClick={() => {
                        onSelectRunAlert(item.id);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings__section">
                <span className="settings__eyebrow">{t('SETTINGS.ISLAND_TITLE')}</span>
                <div className="settings__island">
                  <Switch
                    label={islandLabel}
                    isOn={isIslandOn}
                    onChange={onIslandChange}
                  />
                </div>
              </div>
            </div>
          )}

          {tab === 'shortcuts' && (
            <div className="settings__stack settings__stack--wide">
              <div className="settings__keybinds">
                {keybinds.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      item.isEditing
                        ? 'settings__keybind settings__keybind--editing'
                        : 'settings__keybind'
                    }
                    onClick={() => {
                      onEditKeybind(item.id);
                    }}
                  >
                    <span className="settings__keybind-label">{item.label}</span>
                    <kbd className="settings__keybind-keys">{item.keys}</kbd>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'storage' && <StorageSettings />}

          {tab === 'about' && (
            <div className="settings__about">
              <div className="settings__about-head">
                <Logo size={84} />
                <div className="settings__about-names">
                  <span className="settings__about-name">
                    <Wordmark />
                  </span>
                  <span className="settings__about-version">{version}</span>
                  <Tag>{t('COMMON.BY_SALVE')}</Tag>
                </div>
              </div>
              <div className="settings__about-logs">
                <div className="settings__about-actions">
                  <Button size="sm" onClick={onOpenLogs}>
                    {openLogsLabel}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      void onCopyDiagnostics();
                    }}
                  >
                    {copyDiagnosticsLabel}
                  </Button>
                </div>
              </div>
              <p className="settings__about-rights">{rights}</p>
            </div>
          )}
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {signIn !== null && (
            <AgentSignIn
              key="sign-in"
              agent={signInAgent}
              progress={signIn}
              onCancel={onCancelSignIn}
              onClose={onCloseSignIn}
              onRetry={onRetrySignIn}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  );
};
