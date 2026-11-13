import type { IProjectNavItem } from '@/modules/Project/components/ProjectModal/components/ProjectNav/types';
import type { ITargetLock } from '@/modules/Project/components/ProjectModal/components/TargetCard/types';
import type { ProjectSection } from '@/modules/Project/components/ProjectModal/types';
import type {
  IProjectRepository,
  IReadyColumn,
  ITarget,
  IVariableDraft,
} from '@/modules/Project/types';
import type { BuildPlatform, ProRemoval, TargetKind, TemplateKind } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DELETE_ORG_FAILURES,
  FAILED_REMOVAL,
  PROJECT_SECTIONS,
  TARGET_NAME_KEYS,
} from '@/modules/Project/components/ProjectModal/constants';
import { VARIABLE_FAILURE_KEYS } from '@/modules/Project/constants';
import { useVariableActions } from '@/modules/Project/hooks/useVariableActions';
import { newProjectId, variableChangesOf, webAddressOf } from '@/modules/Project/library';
import { SETUP_LINKS } from '@/modules/Setup/constants';
import { Agent, Archive, Files, Platform, Pro, Run } from '@/services';
import {
  useAppStore,
  useBuildStore,
  useMachineStore,
  useProStore,
  useSetupStore,
  useVariablesStore,
  useWorkspaceStore,
} from '@/store';

export const useProjectModalViewModel = () => {
  const { t } = useTranslation();
  const projects = useAppStore((state) => state.projects);
  const editingProjectId = useAppStore((state) => state.editingProjectId);
  const projectSection = useAppStore((state) => state.projectSection);
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const addProject = useAppStore((state) => state.addProject);
  const updateProject = useAppStore((state) => state.updateProject);
  const removeProject = useAppStore((state) => state.removeProject);
  const closeModal = useAppStore((state) => state.closeModal);
  const tools = useMachineStore((state) => state.tools);
  const isGithubConnected = useSetupStore((state) =>
    state.integrations.some(({ id }) => id === 'github'),
  );
  const isJiraConnected = useSetupStore((state) =>
    state.integrations.some(({ id }) => id === 'jira'),
  );
  const builds = useBuildStore((state) => state.builds);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const removeWorkspacesOf = useWorkspaceStore((state) => state.removeWorkspacesOf);
  const proStatus = useProStore((state) => state.status);
  const shares = useProStore((state) => state.shares);
  const landShare = useProStore((state) => state.landShare);
  const [isDeletingInOrg, setDeletingInOrg] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [deleteFailure, setDeleteFailure] = useState<string | null>(null);

  const [editing] = useState(
    () => projects.find(({ id }) => id === editingProjectId) ?? null,
  );
  const byProject = useVariablesStore((state) => state.byProject);
  const savedVariables = editing === null ? [] : (byProject[editing.id] ?? []);
  const { applyVariables } = useVariableActions();
  const [variables, setVariables] = useState<IVariableDraft[]>(() =>
    savedVariables.map(({ name, description, isSecret }) => ({
      key: `saved-${name}`,
      name,
      description,
      value: '',
      from: name,
      isSecret: isSecret ?? true,
    })),
  );
  const [variableFailure, setVariableFailure] = useState<string | null>(null);
  const [isSaving, setSaving] = useState(false);
  const [isConfirmingDiscard, setConfirmingDiscard] = useState(false);
  const saved = (kind: TargetKind) =>
    editing?.targets.find((target) => target.kind === kind) ?? null;

  const [name, setName] = useState(editing?.name ?? '');
  const [url, setUrl] = useState(saved('web')?.value ?? '');
  const [apk, setApk] = useState(saved('android')?.value ?? '');
  const [app, setApp] = useState(saved('ios')?.value ?? '');
  const [repositories, setRepositories] = useState<IProjectRepository[]>(
    editing?.repositories ?? [],
  );
  const [templates, setTemplates] = useState<Partial<Record<TemplateKind, string>>>(
    editing?.templates ?? {},
  );
  const [ready, setReady] = useState<{
    column: IReadyColumn;
    statuses: string[];
  } | null>(() =>
    editing?.readyColumn === undefined
      ? null
      : { column: editing.readyColumn, statuses: editing.readyStatuses ?? [] },
  );
  const [section, setSection] = useState<ProjectSection>(projectSection ?? 'general');
  const [buildIds, setBuildIds] = useState<Record<BuildPlatform, string | null>>({
    android: null,
    ios: null,
  });

  const buildOf = (platform: BuildPlatform) => {
    const ongoing =
      editing === null
        ? undefined
        : builds.find(
            (build) =>
              build.projectId === editing.id &&
              build.platform === platform &&
              build.phase === 'working',
          );
    const buildId = buildIds[platform] ?? ongoing?.id ?? null;
    const result = builds.find(({ id }) => id === buildId)?.result ?? null;

    return { buildId, artifact: result?.isBuilt === true ? result.artifact : null };
  };
  const androidBuild = buildOf('android');
  const iosBuild = buildOf('ios');
  const apkValue = androidBuild.artifact ?? apk;
  const appValue = iosBuild.artifact ?? app;

  const isMac = Platform.isMac();
  const isSignedInToPro = proStatus?.isSignedIn === true;
  const share = shares.find(({ projectId }) => projectId === editing?.id);
  const linkedOrg = share?.orgSlug ?? null;
  const linkedRole =
    proStatus?.isSignedIn === true
      ? (proStatus.orgs.find(({ slug }) => slug === linkedOrg)?.role ?? null)
      : null;
  const linkedOrgName =
    proStatus?.isSignedIn === true
      ? (proStatus.orgs.find(({ slug }) => slug === linkedOrg)?.name ?? linkedOrg ?? '')
      : (linkedOrg ?? '');
  const canDeleteInOrg =
    linkedOrg !== null && (linkedRole === 'owner' || linkedRole === 'admin');
  const isEditing = editing !== null;
  const own = workspaces.filter((workspace) => workspace.projectId === editing?.id);
  const address = webAddressOf(url);
  const values: Record<TargetKind, string> = {
    web: address ?? url.trim(),
    android: apkValue.trim(),
    ios: appValue.trim(),
  };
  const hasTarget = Object.values(values).some((value) => value.length > 0);

  const orphaned =
    editing?.targets.find(
      (target) =>
        values[target.kind].length === 0 &&
        own.some((workspace) => workspace.targetId === target.id),
    ) ?? null;

  const blocking =
    name.trim().length === 0
      ? t('PROJECT.NEEDS_NAME_EDIT')
      : url.trim().length > 0 && address === null
        ? t('PROJECT.WEB_INVALID')
        : !hasTarget
          ? isEditing
            ? t('PROJECT.NEEDS_TARGET_EDIT')
            : t('PROJECT.NEEDS_TARGET')
          : orphaned === null
            ? undefined
            : t('PROJECT.TARGET_IN_USE', { target: t(TARGET_NAME_KEYS[orphaned.kind]) });

  const targetFor = (kind: TargetKind): ITarget[] => {
    const value = values[kind];

    if (value.length === 0) return [];

    const kept = saved(kind);
    const label = t(TARGET_NAME_KEYS[kind]);

    return [
      kept === null ? { id: `t-${kind}`, kind, label, value } : { ...kept, label, value },
    ];
  };

  const onConfirm = () => {
    if (blocking !== undefined || isSaving) return;

    const targets = [...targetFor('web'), ...targetFor('android'), ...targetFor('ios')];
    const projectId = editing?.id ?? newProjectId();
    const changes = variableChangesOf({ saved: savedVariables, drafts: variables });
    const save = () => {
      const readyOf =
        ready === null
          ? {}
          : { readyColumn: ready.column, readyStatuses: ready.statuses };
      const templatesOf = Object.keys(templates).length === 0 ? {} : { templates };

      if (editing) {
        const {
          readyColumn: _column,
          readyStatuses: _statuses,
          templates: _templates,
          ...kept
        } = editing;

        updateProject({
          ...kept,
          name: name.trim(),
          targets,
          repositories,
          ...readyOf,
          ...templatesOf,
        });
      } else
        addProject({
          id: projectId,
          name: name.trim(),
          targets,
          repositories,
          ...readyOf,
          ...templatesOf,
        });
    };

    if (changes.length === 0) {
      save();

      return;
    }

    setSaving(true);
    setVariableFailure(null);
    void applyVariables({ projectId, changes }).then((outcome) => {
      setSaving(false);

      if (outcome.isSaved) {
        save();

        return;
      }

      setVariableFailure(
        t(
          VARIABLE_FAILURE_KEYS[outcome.failure.reason],
          'name' in outcome.failure ? { name: outcome.failure.name } : {},
        ),
      );
    });
  };

  const countOf = (count: number) => (count > 0 ? count : null);
  const isFirstName = !isEditing && name.trim().length === 0;
  const isFillingIn =
    isFirstName || (!isEditing && !hasTarget && url.trim().length === 0);
  const flagged: ProjectSection | null =
    blocking !== undefined && !isFillingIn
      ? 'general'
      : variableFailure !== null
        ? 'variables'
        : null;
  const navItems: IProjectNavItem[] = [
    ...PROJECT_SECTIONS.map(({ id, labelKey }) => ({
      id,
      label: t(labelKey),
      count:
        id === 'code'
          ? countOf(repositories.length)
          : id === 'variables'
            ? countOf(variables.length)
            : null,
      isFlagged: flagged === id,
      isDanger: false,
    })),
    ...(isEditing
      ? [
          {
            id: 'memories' as const,
            label: t('PROJECT.SECTION_MEMORIES'),
            count: countOf(
              projects
                .find(({ id }) => id === editingProjectId)
                ?.memories?.filter(({ deletedAt }) => deletedAt === null).length ?? 0,
            ),
            isFlagged: false,
            isDanger: false,
          },
        ]
      : []),
    ...(isEditing && (isSignedInToPro || linkedOrg !== null)
      ? [
          {
            id: 'pro' as const,
            label: t('PROJECT.SECTION_PRO'),
            count: null,
            isFlagged: false,
            isDanger: false,
          },
        ]
      : []),
    ...(isEditing
      ? [
          {
            id: 'delete' as const,
            label: t('PROJECT.DELETE'),
            count: null,
            isFlagged: false,
            isDanger: true,
          },
        ]
      : []),
  ];
  const kept = savedVariables.length;
  const losses = [
    ...(own.length === 0
      ? []
      : [
          own.length === 1
            ? t('PROJECT.DELETE_WORKSPACES_ONE')
            : t('PROJECT.DELETE_WORKSPACES_OTHER', { count: own.length }),
        ]),
    ...(kept === 0
      ? []
      : [
          kept === 1
            ? t('PROJECT.DELETE_VARIABLES_ONE')
            : t('PROJECT.DELETE_VARIABLES_OTHER', { count: kept }),
        ]),
  ];

  const onDelete = async () => {
    if (!editing || isDeleting) return;

    setDeleteFailure(null);

    if (linkedOrg !== null) {
      setDeleting(true);

      const removal: ProRemoval =
        canDeleteInOrg && isDeletingInOrg
          ? await Pro.remove(editing.id).catch(() => FAILED_REMOVAL)
          : await Pro.unlink(editing.id).then(
              (share): ProRemoval => {
                landShare(share);

                return { isRemoved: true };
              },
              () => FAILED_REMOVAL,
            );

      setDeleting(false);

      if (!removal.isRemoved) {
        setDeleteFailure(t(DELETE_ORG_FAILURES[removal.failure], { org: linkedOrgName }));

        return;
      }
    }

    for (const workspace of own) {
      Run.stop(workspace.id);
      void Agent.stop(workspace.id);
      Archive.removeWorkspace(workspace.id);
    }

    removeWorkspacesOf(editing.id);
    removeProject({
      projectId: editing.id,
      isOpen: own.some((workspace) => workspace.id === selectedWorkspaceId),
    });
  };

  const builderOf = (props: { platform: BuildPlatform; buildId: string | null }) => ({
    isShown: isGithubConnected && repositories.length > 0,
    buildId: props.buildId,
    onStart: (buildId: string) => {
      setBuildIds((ids) => ({ ...ids, [props.platform]: buildId }));
    },
    onReset: () => {
      setBuildIds((ids) => ({ ...ids, [props.platform]: null }));
    },
  });

  return {
    name,
    url,
    apk: apkValue,
    app: appValue,
    repositories,
    hasReadyField: isJiraConnected,
    readyColumn: ready?.column ?? null,
    readyStatuses: ready?.statuses ?? [],
    projectId: editing?.id ?? null,
    androidBuilder: builderOf({ platform: 'android', buildId: androidBuild.buildId }),
    iosBuilder: builderOf({ platform: 'ios', buildId: iosBuild.buildId }),
    isMac,
    isEditing,
    section,
    navItems,
    isOpen: {
      general: section === 'general',
      code: section === 'code',
      variables: section === 'variables',
      templates: section === 'templates',
      memories: section === 'memories',
      pro: section === 'pro',
      delete: section === 'delete',
    },
    title: isEditing ? t('PROJECT.EDIT_TITLE') : t('PROJECT.NEW_TITLE'),
    confirmLabel: isEditing ? t('PROJECT.SAVE') : t('PROJECT.CREATE'),
    canConfirm: blocking === undefined && !isSaving,
    deleteTitle: isEditing ? t('PROJECT.DELETE_TITLE', { name: editing.name }) : '',
    deleteText:
      losses.length === 0 ? t('PROJECT.DELETE_ALONE') : t('PROJECT.DELETE_TEXT'),
    losses,
    hasLosses: losses.length > 0,
    androidLock:
      tools.androidSdk.isFound || apkValue.length > 0
        ? null
        : ({
            reason: t('PROJECT.ANDROID_LOCKED'),
            setUp: {
              label: t('PROJECT.ANDROID_SET_UP'),
              guide: t('PROJECT.ANDROID_GUIDE'),
              link: { label: t('PROJECT.ANDROID_LINK'), url: SETUP_LINKS.androidStudio },
            },
          } satisfies ITargetLock),
    iosLock: !isMac
      ? ({ reason: t('PROJECT.IOS_LOCKED_MAC'), setUp: null } satisfies ITargetLock)
      : tools.xcode.isFound || appValue.length > 0
        ? null
        : ({
            reason: t('PROJECT.IOS_LOCKED'),
            setUp: {
              label: t('PROJECT.IOS_SET_UP'),
              guide: t('PROJECT.IOS_GUIDE'),
              link: { label: t('PROJECT.IOS_LINK'), url: SETUP_LINKS.xcode },
            },
          } satisfies ITargetLock),
    isConfirmQuiet: section === 'pro' || section === 'delete',
    footerHint: isConfirmingDiscard
      ? t('PROJECT.DISCARD_HINT')
      : ((isFirstName ? undefined : blocking) ?? variableFailure ?? undefined),
    onNameChange: setName,
    onRepositoriesChange: setRepositories,
    onReadyChange: setReady,
    templates,
    templatesOrg: linkedOrg,
    onTemplatesChange: setTemplates,
    variables,
    savedVariables,
    onVariablesChange: (changed: IVariableDraft[]) => {
      setVariableFailure(null);
      setVariables(changed);
    },
    onUrlChange: setUrl,
    onPickApk: () => {
      void Files.pick('apk').then((picked) => {
        if (picked === null) return;

        setBuildIds((ids) => ({ ...ids, android: null }));
        setApk(picked);
      });
    },
    onPickApp: () => {
      void Files.pick('app').then((picked) => {
        if (picked === null) return;

        setBuildIds((ids) => ({ ...ids, ios: null }));
        setApp(picked);
      });
    },
    onCancel: () => {
      const isFilled =
        !isEditing &&
        (name.trim() !== '' ||
          url.trim() !== '' ||
          apk !== '' ||
          app !== '' ||
          repositories.length > 0);

      if (isFilled && !isConfirmingDiscard) setConfirmingDiscard(true);
      else closeModal();
    },
    onConfirm,
    onSelectSection: setSection,
    hasDeleteInOrg: canDeleteInOrg,
    deleteInOrgLabel: t('PROJECT.DELETE_IN_ORG', { org: linkedOrgName }),
    isDeleteInOrgOn: isDeletingInOrg,
    onDeleteInOrgChange: setDeletingInOrg,
    hasDeleteOrgNote: linkedOrg !== null,
    deleteOrgNote:
      canDeleteInOrg && isDeletingInOrg
        ? t('PROJECT.DELETE_IN_ORG_NOTE', { org: linkedOrgName })
        : t('PROJECT.DELETE_LINKED_NOTE', { org: linkedOrgName }),
    hasDeleteFailure: deleteFailure !== null,
    deleteFailure: deleteFailure ?? '',
    canDelete: !isDeleting,
    onDelete: () => {
      void onDelete();
    },
  };
};
