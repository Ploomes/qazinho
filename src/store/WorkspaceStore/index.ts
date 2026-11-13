import type { IWorkspaceStore } from './types';
import { create } from 'zustand';
import {
  answerRound,
  appendAgentError,
  appendMemoryNote,
  appendAgentMessage,
  appendPlanCard,
  appendQuestions,
  appendRunNote,
  appendSkillsNote,
  appendUserMessage,
  formatClock,
  withActivity,
} from '@/modules/Chat/library';
import { RUN_CLOCK } from '@/modules/Run/constants';
import { PANEL } from '@/modules/Workspace/constants';
import {
  endRun,
  landAnswered,
  landAsked,
  landCost,
  landExplored,
  landFiled,
  landFinding,
  landReview,
  landStep,
  landVideo,
  outcomeOfFinding,
  resumeRun,
  startRun,
  takeSuggestion,
} from '@/modules/Workspace/library';
import {
  mapWorkspace,
  tickWorkspaces,
  withBugFlash,
  withoutKey,
  withoutTalk,
} from './library';

export const useWorkspaceStore = create<IWorkspaceStore>((set) => ({
  workspaces: [],
  isLoaded: false,
  panelTab: 'plan',
  openCaseId: null,
  openBugId: null,
  selectedRunId: null,
  bugFilter: 'open',
  isPanelOpen: true,
  panelWidth: PANEL.defaultWidth,
  askingIds: [],
  liveTexts: {},
  activities: {},
  bugFlashes: {},
  bugFlashesLeaving: [],
  developedCases: {},
  planFiles: {},
  unheardTalks: {},
  retries: {},
  readSteps: {},
  lookingAt: {},
  chatDevices: {},
  storyReadAt: {},
  removingWorkspaceId: null,

  addWorkspace: (workspace) =>
    set((state) => ({ workspaces: [...state.workspaces, workspace] })),

  loadWorkspaces: (workspaces) => set({ workspaces, isLoaded: true }),

  askRemoveWorkspace: (removingWorkspaceId) => set({ removingWorkspaceId }),

  removeWorkspace: (workspaceId) =>
    set((state) => ({
      removingWorkspaceId: null,
      workspaces: state.workspaces.filter(({ id }) => id !== workspaceId),
    })),

  renameWorkspace: ({ workspaceId, name }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => ({ ...workspace, name }),
      }),
    })),

  setDesign: ({ workspaceId, design }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => ({ ...workspace, design }),
      }),
    })),

  setUnreadPlan: ({ workspaceId, unreadPlan }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => ({ ...workspace, unreadPlan }),
      }),
    })),

  dismissBug: ({ workspaceId, bugId, isDismissed }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => ({
          ...workspace,
          bugs: workspace.bugs.map((bug) =>
            bug.id === bugId ? { ...bug, isDismissed, isNew: false } : bug,
          ),
        }),
      }),
    })),

  keepPlain: ({ workspaceId, value }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          workspace.plainValues.includes(value)
            ? workspace
            : { ...workspace, plainValues: [...workspace.plainValues, value] },
      }),
    })),

  setPublished: ({ workspaceId, published }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => ({ ...workspace, published }),
      }),
    })),

  setViewport: ({ workspaceId, viewportId }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => ({ ...workspace, viewportId }),
      }),
    })),

  setTarget: ({ workspaceId, targetId, planKind }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => ({ ...workspace, targetId, planKind }),
      }),
    })),

  removeWorkspacesOf: (projectId) =>
    set((state) => ({
      workspaces: state.workspaces.filter(
        (workspace) => workspace.projectId !== projectId,
      ),
    })),

  selectTab: (tab) => set(tab === 'chat' ? { isPanelOpen: true } : { panelTab: tab }),

  noteActivity: ({ workspaceId, tool, target }) =>
    set((state) => ({
      activities: {
        ...state.activities,
        [workspaceId]: withActivity({
          activities: state.activities[workspaceId] ?? [],
          tool,
          target,
        }),
      },
    })),

  shiftBugFlash: ({ workspaceId, id }) =>
    set((state) => {
      const left = (state.bugFlashes[workspaceId] ?? []).filter(
        (flash) => flash.id !== id,
      );

      return {
        bugFlashes: { ...state.bugFlashes, [workspaceId]: left },
        bugFlashesLeaving:
          left.length === 0 && !state.bugFlashesLeaving.includes(workspaceId)
            ? [...state.bugFlashesLeaving, workspaceId]
            : state.bugFlashesLeaving,
      };
    }),

  settleBugFlashes: (workspaceId) =>
    set((state) =>
      state.bugFlashesLeaving.includes(workspaceId)
        ? {
            bugFlashesLeaving: state.bugFlashesLeaving.filter((id) => id !== workspaceId),
          }
        : state,
    ),

  clearBugFlashes: (workspaceId) =>
    set((state) =>
      (state.bugFlashes[workspaceId]?.length ?? 0) === 0 &&
      !state.bugFlashesLeaving.includes(workspaceId)
        ? state
        : {
            bugFlashes: withoutKey({ record: state.bugFlashes, key: workspaceId }),
            bugFlashesLeaving: state.bugFlashesLeaving.filter((id) => id !== workspaceId),
          },
    ),

  setLiveText: ({ workspaceId, text }) =>
    set((state) => ({
      liveTexts: { ...state.liveTexts, [workspaceId]: text },
      activities: state.askingIds.includes(workspaceId)
        ? withoutKey({ record: state.activities, key: workspaceId })
        : state.activities,
      retries: withoutKey({ record: state.retries, key: workspaceId }),
      readSteps: withoutKey({ record: state.readSteps, key: workspaceId }),
      lookingAt: withoutKey({ record: state.lookingAt, key: workspaceId }),
    })),

  setReadStep: ({ workspaceId, step, bytes }) =>
    set((state) => ({
      readSteps: { ...state.readSteps, [workspaceId]: { step, bytes } },
    })),

  setLooking: ({ workspaceId, device }) =>
    set((state) => ({ lookingAt: { ...state.lookingAt, [workspaceId]: device } })),

  setChatDevice: ({ workspaceId, streamUrl, address }) =>
    set((state) => ({
      chatDevices:
        streamUrl === null
          ? withoutKey({ record: state.chatDevices, key: workspaceId })
          : { ...state.chatDevices, [workspaceId]: { streamUrl, address } },
    })),

  setRetry: ({ workspaceId, attempt, maxRetries }) =>
    set((state) => ({
      retries: { ...state.retries, [workspaceId]: { attempt, maxRetries } },
    })),

  sendMessage: ({ workspaceId, text, mentions, command, from, attachments }) =>
    set((state) => ({
      askingIds: [...state.askingIds.filter((id) => id !== workspaceId), workspaceId],
      retries: withoutKey({ record: state.retries, key: workspaceId }),
      readSteps: withoutKey({ record: state.readSteps, key: workspaceId }),
      lookingAt: withoutKey({ record: state.lookingAt, key: workspaceId }),
      liveTexts: { ...state.liveTexts, [workspaceId]: '' },
      activities: withoutKey({ record: state.activities, key: workspaceId }),
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          appendUserMessage({
            workspace,
            text,
            mentions,
            command,
            ...(from === undefined ? {} : { from }),
            ...(attachments === undefined ? {} : { attachments }),
            at: formatClock(new Date()),
          }),
      }),
    })),

  landAgentText: ({ workspaceId, text, who, agentId, sessionId }) =>
    set((state) => ({
      activities: withoutKey({ record: state.activities, key: workspaceId }),
      askingIds: state.askingIds.filter((id) => id !== workspaceId),
      retries: withoutKey({ record: state.retries, key: workspaceId }),
      readSteps: withoutKey({ record: state.readSteps, key: workspaceId }),
      lookingAt: withoutKey({ record: state.lookingAt, key: workspaceId }),
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => ({
          ...appendAgentMessage({ workspace, text, who, at: formatClock(new Date()) }),
          sessionId: sessionId ?? workspace.sessionId,
          sessionAgentId: sessionId === null ? workspace.sessionAgentId : agentId,
        }),
      }),
    })),

  landPlan: ({
    workspaceId,
    summary,
    plan,
    strategy,
    source,
    story,
    page,
    who,
    agentId,
    sessionId,
  }) =>
    set((state) => ({
      askingIds: state.askingIds.filter((id) => id !== workspaceId),
      retries: withoutKey({ record: state.retries, key: workspaceId }),
      readSteps: withoutKey({ record: state.readSteps, key: workspaceId }),
      lookingAt: withoutKey({ record: state.lookingAt, key: workspaceId }),
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => {
          const said = appendAgentMessage({
            workspace,
            text: summary,
            who,
            at: formatClock(new Date()),
          });

          return {
            ...appendPlanCard({ workspace: said, plan, at: formatClock(new Date()) }),
            strategy: strategy ?? workspace.strategy ?? null,
            planSource: source,
            sourcePage: page ?? workspace.sourcePage,
            issue:
              story === null
                ? workspace.issue
                : {
                    key: story.key,
                    title: story.summary,
                    source: 'jira',
                    url: story.url,
                  },
            sessionId: sessionId ?? workspace.sessionId,
            sessionAgentId: sessionId === null ? workspace.sessionAgentId : agentId,
          };
        },
      }),
    })),

  landQuestions: ({ workspaceId, questions }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          appendQuestions({ workspace, questions, at: formatClock(new Date()) }),
      }),
    })),

  answerQuestions: ({ workspaceId, messageId, answers }) =>
    set((state) => ({
      askingIds: [...state.askingIds.filter((id) => id !== workspaceId), workspaceId],
      retries: withoutKey({ record: state.retries, key: workspaceId }),
      readSteps: withoutKey({ record: state.readSteps, key: workspaceId }),
      lookingAt: withoutKey({ record: state.lookingAt, key: workspaceId }),
      liveTexts: { ...state.liveTexts, [workspaceId]: '' },
      activities: withoutKey({ record: state.activities, key: workspaceId }),
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => answerRound({ workspace, messageId, answers }),
      }),
    })),

  landAgentError: ({ workspaceId, text }) =>
    set((state) => ({
      askingIds: state.askingIds.filter((id) => id !== workspaceId),
      retries: withoutKey({ record: state.retries, key: workspaceId }),
      readSteps: withoutKey({ record: state.readSteps, key: workspaceId }),
      lookingAt: withoutKey({ record: state.lookingAt, key: workspaceId }),
      liveTexts: { ...state.liveTexts, [workspaceId]: '' },
      activities: withoutKey({ record: state.activities, key: workspaceId }),
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          appendAgentError({ workspace, text, at: formatClock(new Date()) }),
      }),
    })),

  landMemoryChanges: ({ workspaceId, changes }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          appendMemoryNote({ workspace, changes, at: formatClock(new Date()) }),
      }),
    })),

  landFollowedSkills: ({ workspaceId, names }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          appendSkillsNote({ workspace, names, at: formatClock(new Date()) }),
      }),
    })),

  landAgentStopped: (workspaceId) =>
    set((state) => ({
      askingIds: state.askingIds.filter((id) => id !== workspaceId),
      retries: withoutKey({ record: state.retries, key: workspaceId }),
      readSteps: withoutKey({ record: state.readSteps, key: workspaceId }),
      lookingAt: withoutKey({ record: state.lookingAt, key: workspaceId }),
      liveTexts: { ...state.liveTexts, [workspaceId]: '' },
      activities: withoutKey({ record: state.activities, key: workspaceId }),
    })),

  changePlan: ({ workspaceId, plan }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          appendPlanCard({ workspace, plan, at: formatClock(new Date()) }),
      }),
    })),

  setPlan: ({ workspaceId, plan }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => ({ ...workspace, plan }),
      }),
    })),

  startRun: ({ workspaceId, runId, by, kind, caseIds, mode }) =>
    set((state) => ({
      activities: withoutKey({ record: state.activities, key: workspaceId }),
      bugFlashes: withoutKey({ record: state.bugFlashes, key: workspaceId }),
      bugFlashesLeaving: state.bugFlashesLeaving.filter((id) => id !== workspaceId),
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          startRun({
            workspace,
            runId,
            by,
            startedAt: formatClock(new Date()),
            startedAtMs: Date.now(),
            ...(kind === undefined ? {} : { kind }),
            ...(caseIds === undefined ? {} : { caseIds }),
            ...(mode === undefined ? {} : { mode }),
          }),
      }),
    })),

  landExplored: ({ workspaceId, summary, cases }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => landExplored({ workspace, summary, cases }),
      }),
    })),

  takeSuggestion: ({ workspaceId, messageId, only }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          takeSuggestion({
            workspace,
            messageId,
            at: formatClock(new Date()),
            ...(only === undefined ? {} : { only }),
          }),
      }),
    })),

  resumeRun: ({ run, by }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId: run.workspaceId,
        change: (workspace) =>
          resumeRun({
            workspace,
            run,
            by,
            now: Date.now(),
            startedAt: formatClock(new Date(run.startedAtMs)),
          }),
      }),
    })),

  pauseRun: (workspaceId) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          workspace.live
            ? {
                ...workspace,
                live: { ...workspace.live, isRunning: !workspace.live.isRunning },
              }
            : workspace,
      }),
    })),

  stopRun: (workspaceId) =>
    set((state) => ({
      activities: withoutKey({ record: state.activities, key: workspaceId }),
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          endRun({ workspace, at: formatClock(new Date()), endedBy: 'stopped' }),
      }),
    })),

  setDevelopedCases: ({ workspaceId, caseIds, files }) =>
    set((state) => ({
      developedCases: { ...state.developedCases, [workspaceId]: caseIds },
      planFiles: { ...state.planFiles, [workspaceId]: files ?? [] },
    })),

  markDeveloped: ({ workspaceId, caseId }) =>
    set((state) => ({
      developedCases: {
        ...state.developedCases,
        [workspaceId]: [
          ...(state.developedCases[workspaceId] ?? []).filter((id) => id !== caseId),
          caseId,
        ],
      },
    })),

  talkToRun: ({ workspaceId, text }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          workspace.live === null || workspace.live.isDone
            ? workspace
            : appendUserMessage({
                workspace: {
                  ...workspace,
                  live: {
                    ...workspace.live,
                    talk: workspace.live.talk === 'checking' ? 'checking' : 'waiting',
                  },
                },
                text,
                at: formatClock(new Date()),
                duringRun: workspace.live.id,
              }),
      }),
    })),

  markTalkHeard: (workspaceId) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          workspace.live === null
            ? workspace
            : { ...workspace, live: { ...workspace.live, talk: 'checking' } },
      }),
    })),

  landTalkReply: ({ workspaceId, text, who }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          appendAgentMessage({
            workspace:
              workspace.live === null
                ? workspace
                : { ...workspace, live: withoutTalk(workspace.live) },
            text,
            who,
            at: formatClock(new Date()),
          }),
      }),
    })),

  landUnheardTalks: ({ workspaceId, texts }) =>
    set((state) => ({
      unheardTalks: { ...state.unheardTalks, [workspaceId]: texts },
    })),

  startAskingUnheard: (workspaceId) =>
    set((state) => ({
      unheardTalks: withoutKey({ record: state.unheardTalks, key: workspaceId }),
      askingIds: [...state.askingIds.filter((id) => id !== workspaceId), workspaceId],
      retries: withoutKey({ record: state.retries, key: workspaceId }),
      readSteps: withoutKey({ record: state.readSteps, key: workspaceId }),
      lookingAt: withoutKey({ record: state.lookingAt, key: workspaceId }),
      liveTexts: { ...state.liveTexts, [workspaceId]: '' },
      activities: withoutKey({ record: state.activities, key: workspaceId }),
    })),

  markDoing: ({ workspaceId, index, how }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          workspace.live
            ? { ...workspace, live: { ...workspace.live, doingIndex: index, how } }
            : workspace,
      }),
    })),

  setContext: ({ workspaceId, tokens, window }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          window > 0 ? { ...workspace, context: { tokens, window } } : workspace,
      }),
    })),

  landNote: ({ workspaceId, text, who }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          appendRunNote({ workspace, text, who, at: formatClock(new Date()) }),
      }),
    })),

  landCost: ({ workspaceId, costUsd }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => landCost({ workspace, costUsd }),
      }),
    })),

  landFinding: ({ workspaceId, finding }) =>
    set((state) => ({
      bugFlashes: withBugFlash({
        flashes: state.bugFlashes,
        workspaces: state.workspaces,
        outcome: outcomeOfFinding({ workspaceId, finding }),
        isIncidental: true,
      }),
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          landFinding({ workspace, finding, at: formatClock(new Date()) }),
      }),
    })),

  landAsked: ({ workspaceId, question }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => landAsked({ workspace, question }),
      }),
    })),

  landAnswered: ({ workspaceId, asked }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          landAnswered({ workspace, asked, at: formatClock(new Date()) }),
      }),
    })),

  markStreaming: ({ workspaceId, url }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          workspace.live
            ? workspace.live.isDone
              ? workspace
              : { ...workspace, live: { ...workspace.live, streamUrl: url } }
            : workspace,
      }),
    })),

  markManual: ({ workspaceId, turn }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          workspace.live === null || workspace.live.isDone
            ? workspace
            : { ...workspace, live: { ...workspace.live, manual: turn, how: 'manual' } },
      }),
    })),

  setDoubts: ({ workspaceId, doubts }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => ({ ...workspace, doubts }),
      }),
    })),

  setStoryStage: ({ workspaceId, stage }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: ({ storyStage: _stage, ...workspace }) =>
          stage === null ? workspace : { ...workspace, storyStage: stage },
      }),
    })),

  markStoryRead: ({ workspaceId, at }) =>
    set((state) => ({ storyReadAt: { ...state.storyReadAt, [workspaceId]: at } })),

  markScreens: ({ workspaceId, screens }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          workspace.live && !workspace.live.isDone
            ? { ...workspace, live: { ...workspace.live, screens } }
            : workspace,
      }),
    })),

  markAddress: ({ workspaceId, url }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          workspace.live && !workspace.live.isDone
            ? { ...workspace, live: { ...workspace.live, address: url } }
            : workspace,
      }),
    })),

  landStep: (outcome) =>
    set((state) => ({
      bugFlashes:
        outcome.verdict === 'failed'
          ? withBugFlash({
              flashes: state.bugFlashes,
              workspaces: state.workspaces,
              outcome,
              isIncidental: false,
            })
          : state.bugFlashes,
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId: outcome.workspaceId,
        change: (workspace) =>
          landStep({ workspace, outcome, at: formatClock(new Date()) }),
      }),
    })),

  landRunDone: (workspaceId) =>
    set((state) => ({
      activities: withoutKey({ record: state.activities, key: workspaceId }),
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          endRun({ workspace, at: formatClock(new Date()), endedBy: 'finished' }),
      }),
    })),

  landVideo: ({ workspaceId, runId, video }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => landVideo({ workspace, runId, video }),
      }),
    })),

  landRunFailed: ({ workspaceId, text, detail }) =>
    set((state) => ({
      activities: withoutKey({ record: state.activities, key: workspaceId }),
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => {
          const at = formatClock(new Date());
          const ended = endRun({
            workspace: appendAgentError({
              workspace,
              text,
              at,
              detail: detail ?? null,
              runId: workspace.live?.isDone === false ? workspace.live.id : null,
            }),
            at,
            endedBy: 'broke',
          });

          return ended.live === workspace.live ? { ...ended, status: 'stopped' } : ended;
        },
      }),
    })),

  tickClock: () =>
    set((state) => {
      const workspaces = tickWorkspaces({
        workspaces: state.workspaces,
        seconds: RUN_CLOCK.tickMs / 1_000,
      });

      return workspaces === state.workspaces ? state : { workspaces };
    }),

  toggleCase: (caseId) =>
    set((state) => ({ openCaseId: state.openCaseId === caseId ? null : caseId })),

  toggleBug: (bugId) =>
    set((state) => ({ openBugId: state.openBugId === bugId ? null : bugId })),

  landReview: ({ workspaceId, bugId, review }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => landReview({ workspace, bugId, review }),
      }),
    })),

  landFiled: ({ workspaceId, bugId, issue }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => landFiled({ workspace, bugId, issue }),
      }),
    })),

  selectRun: (runId) => set({ selectedRunId: runId }),

  setBugFilter: (bugFilter) => set({ bugFilter }),

  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

  setPanelWidth: (width) =>
    set({ panelWidth: Math.min(Math.max(width, PANEL.minWidth), PANEL.maxWidth) }),
}));
