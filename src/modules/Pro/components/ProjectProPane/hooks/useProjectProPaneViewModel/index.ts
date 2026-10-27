import type {
  IProjectProPaneProps,
  PaneWork,
} from '@/modules/Pro/components/ProjectProPane/types';
import type { IProPublishBrief, IProShare } from '@/shared/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PANE_STATE_KEYS } from '@/modules/Pro/components/ProjectProPane/constants';
import { PRO_BILLING, PRO_ROLES } from '@/modules/Pro/constants';
import { useProUpdate } from '@/modules/Pro/hooks/useProUpdate';
import {
  bytesLabelOf,
  copiedProjectOf,
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
  const [hasHistoryMedia, setHistoryMedia] = useState(true);
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
  const sentAt =
    share?.syncedAt === null || share?.syncedAt === undefined
      ? null
      : new Intl.DateTimeFormat(language, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(share.syncedAt));
  const countLabel = (props: { count: number; one: 'PLANS' | 'RUNS' | 'BUGS' }) =>
    props.count === 1
      ? t(`PRO.PANE_BRIEF_${props.one}_ONE`)
      : t(`PRO.PANE_BRIEF_${props.one}_OTHER`, { count: props.count });

  return {
    isSignedOut: signedIn === null,
    isNoOrg: signedIn !== null && orgs.length === 0 && linkedOrg === null,
    isLocal: isLocal && orgs.length > 0,
    isLinked: linkedOrg !== null && !isUnlinked,
    isUnlinked: linkedOrg !== null && isUnlinked,
    hasUnlink: linkedOrg !== null,
    signedOutText: t('PRO.PANE_SIGNED_OUT'),
    noOrgText: t('PRO.PANE_NO_ORG'),
    local: {
      title: t('PRO.PANE_LOCAL_TITLE'),
      text: t('PRO.PANE_LOCAL_TEXT'),
      orgsLabel: t('PRO.PANE_PUBLISH_TO'),
      orgs: orgs.map((one) => {
        const isOn = one.slug === orgSlug;

        return {
          slug: one.slug,
          name: one.name,
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
      hasFacts: brief !== null,
      facts:
        brief === null
          ? []
          : [
              countLabel({ count: brief.plans, one: 'PLANS' }),
              countLabel({ count: brief.runs, one: 'RUNS' }),
              countLabel({ count: brief.bugs, one: 'BUGS' }),
            ],
      mediaLabel: t('PRO.PANE_MEDIA'),
      isMediaOn: hasHistoryMedia,
      mediaNote: t('PRO.PANE_MEDIA_NOTE', {
        size: bytesLabelOf({ bytes: brief?.mediaBytes ?? 0, language }),
      }),
      publishLabel:
        working === 'publish'
          ? t('PRO.PANE_PUBLISHING')
          : t('PRO.PANE_PUBLISH', { org: orgNameOf(orgSlug) }),
      canPublish: working === null && orgSlug !== null && project !== null,
    },
    linked: {
      title: t('PRO.PANE_LINKED_TITLE', { org }),
      stateLine:
        stateKey !== undefined
          ? t(stateKey, { org })
          : sentAt === null
            ? t('PRO.PANE_NEVER_SENT')
            : t('PRO.PANE_SENT_AT', { when: sentAt }),
      factsNote: t('PRO.PANE_FACTS_NOTE'),
      pendingText:
        pending.length === 0
          ? t('PRO.PANE_PENDING_NONE')
          : pending.length === 1
            ? t('PRO.PANE_PENDING_ONE', { names: namesOf(pending) })
            : t('PRO.PANE_PENDING_OTHER', {
                count: pending.length,
                names: namesOf(pending),
              }),
      sendLabel: working === 'send' ? t('PRO.PANE_SENDING') : t('PRO.PANE_SEND'),
      canSend: working === null && pending.length > 0,
      hasUpdates: updates.length > 0,
      updatesText:
        updates.length === 1
          ? t('PRO.PANE_UPDATES_ONE', {
              names: namesOf(updates.map(({ workspaceId }) => workspaceId)),
            })
          : t('PRO.PANE_UPDATES_OTHER', {
              count: updates.length,
              names: namesOf(updates.map(({ workspaceId }) => workspaceId)),
            }),
      hasUpdatesRunning: running.length > 0,
      updatesRunningText:
        running.length === 1
          ? t('PRO.PANE_UPDATES_RUNNING_ONE', { names: namesOf(running) })
          : t('PRO.PANE_UPDATES_RUNNING_OTHER', { names: namesOf(running) }),
      updateLabel: working === 'update' ? t('PRO.PANE_UPDATING') : t('PRO.PANE_UPDATE'),
      canUpdate: working === null && moved.some(({ isBusy }) => !isBusy),
      copyTitle: t('PRO.PANE_COPY_TITLE'),
      copyText: t('PRO.PANE_COPY_TEXT'),
      copyLabel: t('PRO.PANE_COPY'),
      canCopy: working === null,
    },
    unlinked: {
      text: stateKey === undefined ? '' : t(stateKey, { org }),
      canPublishAgain: share?.state === 'gone',
      publishAgainLabel:
        working === 'publish'
          ? t('PRO.PANE_PUBLISHING')
          : t('PRO.PANE_PUBLISH_AGAIN', { org }),
    },
    unlinkTitle: t('PRO.PANE_UNLINK_TITLE'),
    unlinkText: t('PRO.PANE_UNLINK_TEXT', { org }),
    unlinkLabel: t('PRO.PANE_UNLINK', { org }),
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
