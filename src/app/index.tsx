import { AnimatePresence, MotionConfig } from 'motion/react';
import { AssistantDock } from '@/modules/Assistant';
import { AllBugs } from '@/modules/Bug';
import { ManualDock } from '@/modules/Device';
import { NewsModal } from '@/modules/Help';
import { FirstRun, Home, NewProject } from '@/modules/Home';
import { ChangeRunWarning } from '@/modules/Plan';
import { ProLinkModal, ProMergeModal, ProRunWarning } from '@/modules/Pro';
import { ProjectModal, VariablesModal } from '@/modules/Project';
import { RunReplay } from '@/modules/Run';
import { Settings } from '@/modules/Settings';
import { Onboarding } from '@/modules/Setup';
import { UpdateRequired } from '@/modules/Update';
import { AgentPanel, NewWorkspaceModal, Workspace } from '@/modules/Workspace';
import {
  ErrorBarrier,
  Lightbox,
  Titlebar,
  TooltipLayer,
} from '@/shared/components/organisms';
import { SearchPalette } from './components/SearchPalette';
import { Sidebar } from './components/Sidebar';
import { useAppViewModel } from './hooks';
import './styles.css';

export const App: React.FC = () => {
  const {
    shellStyle,
    isUpdateBlocked,
    isDocked,
    isTitlebarBare,
    isOnboarding,
    hasSidebar,
    cardClassName,
    isFirstRun,
    isHome,
    isChatOnly,
    isWorkspace,
    isSettings,
    isNewProject,
    isBugs,
    modal,
    projectModalKey,
    variablesKey,
    hasMedia,
    hasReplay,
    replayKey,
    hasProLink,
    hasProMerge,
    hasHeldRun,
    hasChangeHold,
    hasSearch,
  } = useAppViewModel();

  return isDocked ? (
    <MotionConfig reducedMotion="user">
      <ManualDock />
      <TooltipLayer />
    </MotionConfig>
  ) : (
    <MotionConfig reducedMotion="user">
      <div className="app" style={shellStyle}>
        <Titlebar isBare={isTitlebarBare} />
        {isUpdateBlocked ? (
          <div className="app__body">
            <main className={cardClassName}>
              <UpdateRequired />
            </main>
          </div>
        ) : (
          <>
            <div className="app__body">
              <ErrorBarrier region="screen">
                {!isOnboarding && hasSidebar && (
                  <ErrorBarrier region="sidebar">
                    <Sidebar />
                  </ErrorBarrier>
                )}
                {!isOnboarding && isSettings ? (
                  <Settings />
                ) : (
                  <main className={cardClassName}>
                    {isOnboarding && <Onboarding />}
                    {!isOnboarding && isFirstRun && <FirstRun />}
                    {!isOnboarding && isHome && <Home />}
                    {!isOnboarding && !isFirstRun && isWorkspace && !isChatOnly && (
                      <Workspace />
                    )}
                    {!isOnboarding && !isFirstRun && isWorkspace && <AgentPanel />}
                    {!isOnboarding && !isFirstRun && isBugs && <AllBugs />}
                    {!isOnboarding && !isFirstRun && isNewProject && <NewProject />}
                  </main>
                )}
              </ErrorBarrier>
            </div>

            <AnimatePresence>
              {hasMedia && <Lightbox key="lightbox" />}
              {hasReplay && <RunReplay key={replayKey} />}
              {modal === 'project' && <ProjectModal key={projectModalKey} />}
              {modal === 'workspace' && <NewWorkspaceModal key="workspace" />}
              {modal === 'news' && <NewsModal key="news" />}
              {variablesKey !== null && <VariablesModal key={variablesKey} />}
              {hasProLink && <ProLinkModal key="pro-link" />}
              {hasProMerge && <ProMergeModal key="pro-merge" />}
              {hasHeldRun && <ProRunWarning key="pro-run-warning" />}
              {hasChangeHold && <ChangeRunWarning key="change-run-warning" />}
              {hasSearch && <SearchPalette key="search" />}
            </AnimatePresence>

            {!isOnboarding && <AssistantDock />}
          </>
        )}
        <TooltipLayer />
      </div>
    </MotionConfig>
  );
};
