import type { ProDownloadState } from '@/modules/Pro/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PRO_DOWNLOAD_FAILURES } from '@/modules/Pro/components/ProAccountCard/constants';
import { useOrgDownload } from '@/modules/Pro/hooks/useOrgDownload';
import { Pro } from '@/services';
import { useAppStore, useProStore, useWorkspaceStore } from '@/store';

export const useProLinkModalViewModel = () => {
  const { t } = useTranslation();
  const link = useProStore((state) => state.link);
  const status = useProStore((state) => state.status);
  const setLink = useProStore((state) => state.setLink);
  const projects = useAppStore((state) => state.projects);
  const selectWorkspace = useAppStore((state) => state.selectWorkspace);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const bringHere = useOrgDownload();
  const [state, setState] = useState<ProDownloadState | null>(null);
  const [names, setNames] = useState<string | null>(null);
  const signedIn = status?.isSignedIn === true ? status : null;
  const org = signedIn?.orgs.find(({ slug }) => slug === link?.orgSlug) ?? null;
  const isProjectHere = projects.some(({ id }) => id === link?.projectId);
  const canDownload = org !== null && !isProjectHere;
  const orgSlug = link?.orgSlug ?? '';
  const projectId = link?.projectId ?? '';
  const workspaceId = link?.workspaceId ?? '';

  useEffect(() => {
    if (!canDownload || orgSlug === '') return;

    void Pro.orgProjects(orgSlug).then((listed) => {
      if (!listed.isListed) return;

      const project = listed.projects.find((one) => one.projectId === projectId);
      const plan = project?.plans.find((one) => one.workspaceId === workspaceId);

      if (project !== undefined)
        setNames(plan === undefined ? project.name : `${project.name} / ${plan.name}`);
    });
  }, [canDownload, orgSlug, projectId, workspaceId]);

  const close = () => {
    setLink(null);
  };

  return {
    title: t('PRO.LINK_TITLE'),
    subtitle:
      signedIn === null
        ? t('PRO.LINK_SIGNED_OUT', { org: orgSlug })
        : org === null
          ? t('PRO.LINK_NOT_MEMBER', { org: orgSlug })
          : isProjectHere
            ? t('PRO.LINK_NOT_HERE')
            : t('PRO.LINK_DOWNLOAD_BODY', { org: org.name }),
    hasNames: canDownload && names !== null,
    names: names ?? '',
    hasFailure: state !== null && state !== 'working',
    failure: state === null || state === 'working' ? '' : t(PRO_DOWNLOAD_FAILURES[state]),
    confirmLabel: canDownload
      ? state === 'working'
        ? t('PRO.LINK_DOWNLOADING')
        : t('PRO.LINK_DOWNLOAD')
      : t('PRO.LINK_OK'),
    canConfirm: state !== 'working',
    onCancel: close,
    onConfirm: () => {
      if (!canDownload || link === null) {
        close();

        return;
      }

      setState('working');
      void bringHere({ orgSlug: link.orgSlug, projectId: link.projectId }).then(
        (done) => {
          if (!done.isDownloaded) {
            setState(done.failure);

            return;
          }

          const opened = done.workspaceIds.includes(link.workspaceId)
            ? link.workspaceId
            : done.workspaceIds[0];

          if (opened !== undefined) {
            selectWorkspace(opened);
            selectTab('plan');
          }

          close();
        },
      );
    },
  };
};
