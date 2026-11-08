import type { PaneRowTone } from '@/modules/Pro/components/ProjectProPane/components/PaneRow/types';
import type {
  IProjectProPaneProps,
  PaneWork,
} from '@/modules/Pro/components/ProjectProPane/types';
import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { IProPublishBrief, IProShare } from '@/shared/types';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PANE_STATE_KEYS,
  PROJECT_PRO_PANE,
} from '@/modules/Pro/components/ProjectProPane/constants';
import { PRO_BILLING, PRO_ROLES } from '@/modules/Pro/constants';
import { useProUpdate } from '@/modules/Pro/hooks/useProUpdate';
import {
  bytesLabelOf,
  copiedProjectOf,
  initialsOf,
  planUpdatesOf,
  proBatchOf,
  publishingOrgOf,
} from '@/modules/Pro/library';
import { Pro, Variables } from '@/services';
import {
  useAppStore,
  useProStore,
  useSettingsStore,
  useVariablesStore,
  useWorkspaceStore,
} from '@/store';

export const useProjectProPaneViewModel = (props: IProjectProPaneProps) => {
  const { projectId } = props;
  const { t } = useTranslation();
  const status = useProStore((state) => state.status);
  const shares = useProStore((state) => state.shares);
  const landShare = useProStore((state) => state.landShare);
  const projects = useAppStore((state) => state.projects);
  const putProject = useAppStore((state) => state.putProject);
  const openProSettings = useAppStore((state) => state.openProSettings);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const addWorkspace = useWorkspaceStore((state) => state.addWorkspace);
  const landVariables = useVariablesStore((state) => state.land);
  const language = useSettingsStore((state) => state.language);
  const { update } = useProUpdate();
  const [chosen, setChosen] = useState<string | null>(null);
  const [hasHistoryMedia, setHistoryMedia] = useState(false);
  const [brief, setBrief] = useState<IProPublishBrief | null>(null);
  const [working, setPaneWork] = useState<PaneWork | null>(null);

  const signedIn = status?.isSignedIn === true ? status : null;
  const project = projects.find(({ id }) => id === projectId) ?? null;
  const share = shares.find((one) => one.projectId === projectId);
  const linkedOrg = share?.orgSlug ?? null;
  const isUnlinked = share?.state === 'gone' || share?.state === 'no-access';
  const isLocal = signedIn !== null && linkedOrg === null;
  const orgs = (signedIn?.orgs ?? []).filter(({ role }) => role !== 'reader');
  const orgSlug = publishingOrgOf({ orgs: signedIn?.orgs ?? [], chosen });
  const orgNameOf = (slug: string | null) =>
    signedIn?.orgs.find((one) => one.slug === slug)?.name ?? slug ?? '';
  const org = orgNameOf(linkedOrg);

  useEffect(() => {
    if (!isLocal) return;

    const here = useAppStore.getState().projects.find(({ id }) => id === projectId);

    if (here === undefined) return;

    void Pro.brief(
      proBatchOf({ project: here, workspaces: useWorkspaceStore.getState().workspaces }),
    ).then(setBrief);
  }, [isLocal, projectId]);

  const batchOf = () => (project === null ? null : proBatchOf({ project, workspaces }));

  const run = async (props: {
    kind: PaneWork;
    work: () => Promise<IProShare | null>;
  }) => {
    if (working !== null) return;

    setPaneWork(props.kind);

    const share = await props.work().catch(() => null);

    if (share !== null) landShare(share);

    setPaneWork(null);
  };

  const publish = (props: { org: string | null; withMedia: boolean }) => {
    const batch = batchOf();
    const org = props.org;

    if (batch === null || org === null) return;

    void run({
      kind: 'publish',
      work: () => Pro.publish({ batch, orgSlug: org, hasHistoryMedia: props.withMedia }),
    });
  };

  const unlink = () => {
    void run({ kind: 'unlink', work: () => Pro.unlink(projectId) });
  };

  const copy = async () => {
    if (project === null || working !== null) return;

    setPaneWork('copy');

    const copied = copiedProjectOf({
      project,
      workspaces,
      name: t('PRO.PANE_COPY_NAME', { name: project.name }),
      now: Date.now(),
    });

    putProject(copied.project);

    for (const workspace of copied.workspaces) addWorkspace(workspace);

    const outcome = await Variables.copy({
      from: project.id,
      to: copied.project.id,
    }).catch(() => null);

    if (outcome?.isSaved === true)
      landVariables({ projectId: copied.project.id, variables: outcome.variables });

    setPaneWork(null);
    openProSettings(copied.project.id);
  };

  const namesOf = (workspaceIds: string[]) =>
    workspaceIds
      .map((id) => workspaces.find((workspace) => workspace.id === id)?.name ?? id)
      .join(', ');

  const pending = share?.pending ?? [];
  const updates = share?.conflicts ?? [];
  const moved = planUpdatesOf({ share, workspaces });
  const running = moved
    .filter(({ isBusy }) => isBusy)
    .map(({ workspace }) => workspace.id);
  const stateKey = share === undefined ? undefined : PANE_STATE_KEYS[share.state];
  const hasAlert = stateKey !== undefined && share?.state !== 'sending';
  const sentAt =
    share?.syncedAt === null || share?.syncedAt === undefined
      ? null
      : new Intl.DateTimeFormat(language, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(share.syncedAt));
  const statOf = (props: {
    count: number;
    one: 'PLANS' | 'RUNS' | 'BUGS' | 'MEMORIES';
  }) =>
    props.count === 1
      ? t(`PRO.PANE_STAT_${props.one}_ONE`, { count: props.count })
      : t(`PRO.PANE_STAT_${props.one}_OTHER`, { count: props.count });
  const hasPending = pending.length > 0;
  const pendingIcon: IconName = hasPending ? 'up' : 'check';
  const pendingTone: PaneRowTone = hasPending ? 'lit' : 'plain';

  return {
    style: {
      '--project-pro-tile': `${String(PROJECT_PRO_PANE.tilePx)}px`,
      '--project-pro-head-tile': `${String(PROJECT_PRO_PANE.headTilePx)}px`,
    } as CSSProperties,
    isSignedOut: signedIn === null,
    isNoOrg: signedIn !== null && orgs.length === 0 && linkedOrg === null,
    isLocal: isLocal && orgs.length > 0,
    isLinked: linkedOrg !== null && !isUnlinked,
    isUnlinked: linkedOrg !== null && isUnlinked,
    hasUnlink: linkedOrg !== null,
    signedOut: { title: t('PRO.PANE_SIGNED_OUT_TITLE'), text: t('PRO.PANE_SIGNED_OUT') },
    noOrg: { title: t('PRO.PANE_NO_ORG_TITLE'), text: t('PRO.PANE_NO_ORG') },
    local: {
      orgsLabel: t('PRO.PANE_PUBLISH_TO'),
      orgs: orgs.map((one) => {
        const isOn = one.slug === orgSlug;

        return {
          slug: one.slug,
          name: one.name,
          initials: initialsOf(one.name),
          note: t('PRO.CARD_ORG_NOTE', {
            role: t(PRO_ROLES[one.role]),
            billing: t(PRO_BILLING[one.billingStatus].labelKey),
          }),
          isOn,
          className: isOn ? 'project-pro__org project-pro__org--on' : 'project-pro__org',
          onClick: () => {
            setChosen(one.slug);
          },
        };
      }),
      brief:
        brief === null
          ? ''
          : t(brief.memories > 0 ? 'PRO.PANE_BRIEF_MEMORIES' : 'PRO.PANE_BRIEF', {
              plans: statOf({ count: brief.plans, one: 'PLANS' }),
              runs: statOf({ count: brief.runs, one: 'RUNS' }),
              bugs: statOf({ count: brief.bugs, one: 'BUGS' }),
              memories: statOf({ count: brief.memories, one: 'MEMORIES' }),
            }),
      mediaSwitch:
        brief === null
          ? t('PRO.PANE_MEDIA_SWITCH')
          : t('PRO.PANE_MEDIA_SWITCH_SIZE', {
              size: bytesLabelOf({ bytes: brief.mediaBytes, language }),
            }),
      isMediaOn: hasHistoryMedia,
      publishLabel:
        working === 'publish'
          ? t('PRO.PANE_PUBLISHING')
          : t('PRO.PANE_PUBLISH', { org: orgNameOf(orgSlug) }),
      canPublish: working === null && orgSlug !== null && project !== null,
    },
    head: {
      initials: initialsOf(org),
      title: t('PRO.PANE_LINKED_TITLE', { org }),
      stateLine:
        stateKey !== undefined
          ? t(stateKey, { org })
          : sentAt === null
            ? t('PRO.PANE_NEVER_SENT')
            : t('PRO.PANE_SENT_AT', { when: sentAt }),
      hasAlert,
      stateClassName: hasAlert
        ? 'project-pro__state project-pro__state--alert'
        : 'project-pro__state',
    },
    linked: {
      plansLabel: t('PRO.PANE_PLANS'),
      hasPending,
      pendingIcon,
      pendingTone,
      pendingTitle: !hasPending
        ? t('PRO.PANE_PENDING_NONE')
        : pending.length === 1
          ? t('PRO.PANE_PENDING_ONE')
          : t('PRO.PANE_PENDING_OTHER', { count: pending.length }),
      pendingText: hasPending ? namesOf(pending) : undefined,
      sendLabel: working === 'send' ? t('PRO.PANE_SENDING') : t('PRO.PANE_SEND'),
      canSend: working === null && hasPending,
      hasUpdates: updates.length > 0,
      updatesTitle:
        updates.length === 1
          ? t('PRO.PANE_UPDATES_ONE')
          : t('PRO.PANE_UPDATES_OTHER', { count: updates.length }),
      updatesText: namesOf(updates.map(({ workspaceId }) => workspaceId)),
      updatesNote:
        running.length === 0
          ? undefined
          : running.length === 1
            ? t('PRO.PANE_UPDATES_RUNNING_ONE', { names: namesOf(running) })
            : t('PRO.PANE_UPDATES_RUNNING_OTHER', { names: namesOf(running) }),
      updateLabel: working === 'update' ? t('PRO.PANE_UPDATING') : t('PRO.PANE_UPDATE'),
      canUpdate: working === null && moved.some(({ isBusy }) => !isBusy),
      copyTitle: t('PRO.PANE_COPY_TITLE'),
      copyLabel: t('PRO.PANE_COPY'),
      canCopy: working === null,
    },
    unlinked: {
      canPublishAgain: share?.state === 'gone',
      title: t('PRO.PANE_REPUBLISH_TITLE', { org }),
      label: working === 'publish' ? t('PRO.PANE_PUBLISHING') : t('PRO.PANE_REPUBLISH'),
    },
    linkLabel: t('PRO.PANE_LINK'),
    unlinkTitle: t('PRO.PANE_UNLINK_TITLE', { org }),
    unlinkText: t('PRO.PANE_UNLINK_TEXT', { org }),
    unlinkLabel: t('PRO.PANE_UNLINK'),
    canUnlink: working === null,
    onMediaChange: setHistoryMedia,
    onPublish: () => {
      publish({ org: orgSlug, withMedia: hasHistoryMedia });
    },
    onPublishAgain: () => {
      publish({ org: linkedOrg, withMedia: true });
    },
    onSend: () => {
      const batch = batchOf();

      if (batch === null || pending.length === 0) return;

      void run({ kind: 'send', work: () => Pro.sendPlans(batch) });
    },
    onUpdate: () => {
      void run({
        kind: 'update',
        work: async () => {
          await update(projectId);

          return null;
        },
      });
    },
    onCopy: () => {
      void copy();
    },
    onUnlink: unlink,
  };
};
