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
import { SkillsSettings } from '@/modules/Skills';
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
    agentsLabel,
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

          {tab === 'agent' && (
            <div className="settings__stack">
              <div className="settings__tools" role="radiogroup" aria-label={agentsLabel}>
                {agents.map((item) => (
                  <ToolCard
                    key={item.name}
                    name={item.name}
                    detail={item.detail}
                    state={item.state}
                    badge={item.badge}
                    isSelected={item.isDefault}
                    onSelect={() => {
                      onSelectAgent(item.name);
                    }}
                    action={
                      item.canSignIn ? (
                        <Button size="sm" onClick={item.onSignIn}>
                          {t('SETUP.SIGN_IN')}
                        </Button>
                      ) : item.canInstall ? (
                        <Button size="sm" onClick={item.onInstall}>
                          {t('SETUP.INSTALL')}
                        </Button>
                      ) : undefined
                    }
                  >
                    <AnimatePresence initial={false}>
                      {item.install !== null && (
                        <InstallProgress
                          key="install"
                          state={item.install}
                          onRetry={item.onInstall}
                        />
                      )}
                    </AnimatePresence>
                  </ToolCard>
                ))}
              </div>
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

          {tab === 'agent' && (
            <div className="settings__stack settings__stack--group">
              <span className="settings__eyebrow">{t('SETTINGS.DEVICES')}</span>
              <div className="settings__tools">
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
                          <Button size="sm" onClick={onInstallIdb}>
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
              </div>
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

          {tab === 'connections' && (
            <div className="settings__stack">
              <span className="settings__eyebrow">{t('SETTINGS.GROUP_TRACKERS')}</span>
              {integrations.map((item) => (
                <IntegrationCard key={item.id} integration={item} />
              ))}
            </div>
          )}

          {tab === 'connections' && (
            <div className="settings__stack settings__stack--group">
              <span className="settings__eyebrow">{t('SETTINGS.GROUP_AGENT_TOOLS')}</span>
              {mcpServers.map((item) => (
                <McpCard key={item.id} server={item} />
              ))}
              <OutsideServerCard />
            </div>
          )}

          {tab === 'general' && (
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

          {tab === 'general' && (
            <div className="settings__stack settings__stack--wide settings__stack--group">
              <span className="settings__eyebrow">{t('SETTINGS.SHORTCUTS')}</span>
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

          {tab === 'skills' && <SkillsSettings />}

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
