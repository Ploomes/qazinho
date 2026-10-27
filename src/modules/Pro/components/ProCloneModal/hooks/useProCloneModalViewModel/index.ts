import type { IProCloneModalProps } from '@/modules/Pro/components/ProCloneModal/types';
import type { ProDownloadState } from '@/modules/Pro/types';
import type { IProOrgProject, ProOrgProjects } from '@/shared/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PRO_DOWNLOAD_FAILURES } from '@/modules/Pro/components/ProAccountCard/constants';
import { useOrgDownload } from '@/modules/Pro/hooks/useOrgDownload';
import { Pro } from '@/services';
import { useAppStore, useProStore } from '@/store';

export const useProCloneModalViewModel = (props: IProCloneModalProps) => {
  const { onClose } = props;
  const { t } = useTranslation();
  const status = useProStore((state) => state.status);
  const projects = useAppStore((state) => state.projects);
  const selectWorkspace = useAppStore((state) => state.selectWorkspace);
  const bringHere = useOrgDownload();
  const orgs = status?.isSignedIn === true ? status.orgs : [];
  const [orgSlug, setOrgSlug] = useState(orgs[0]?.slug ?? null);
  const [query, setQuery] = useState('');
  const [listed, setListed] = useState<{ orgSlug: string; read: ProOrgProjects } | null>(
    null,
  );
  const [downloads, setDownloads] = useState<Record<string, ProDownloadState>>({});

  useEffect(() => {
    if (orgSlug === null) return;

    let isLive = true;

    void Pro.orgProjects(orgSlug).then((read) => {
      if (isLive) setListed({ orgSlug, read });
    });

    return () => {
      isLive = false;
    };
  }, [orgSlug]);

  const org = orgs.find(({ slug }) => slug === orgSlug) ?? null;
  const read = listed?.orgSlug === orgSlug ? listed.read : null;
  const all = read?.isListed === true ? read.projects : [];
  const needle = query.trim().toLowerCase();
  const found = all.filter(
    ({ name, key }) =>
      needle === '' ||
      name.toLowerCase().includes(needle) ||
      key.toLowerCase().includes(needle),
  );
  const orgName = org?.name ?? '';

  const clone = async (offer: IProOrgProject) => {
    setDownloads((current) => ({ ...current, [offer.projectId]: 'working' }));

    const done = await bringHere({ orgSlug: offer.orgSlug, projectId: offer.projectId });

    if (!done.isDownloaded) {
      setDownloads((current) => ({ ...current, [offer.projectId]: done.failure }));

      return;
    }

    if (done.workspaceIds[0] !== undefined) selectWorkspace(done.workspaceIds[0]);

    onClose();
  };

  return {
    title: t('PRO.CLONE_TITLE'),
    subtitle: t('PRO.CLONE_SUBTITLE'),
    confirmLabel: t('PRO.CLONE_DONE'),
    hasOrgChoice: orgs.length > 1,
    orgsLabel: t('PRO.ORGS'),
    orgs: orgs.map((one) => {
      const isOn = one.slug === orgSlug;

      return {
        slug: one.slug,
        name: one.name,
        isOn,
        className: isOn ? 'pro-clone__org pro-clone__org--on' : 'pro-clone__org',
        onClick: () => {
          if (isOn) return;

          setOrgSlug(one.slug);
          setDownloads({});
        },
      };
    }),
    query,
    searchLabel: t('PRO.CLONE_SEARCH'),
    placeholder: t('PRO.CLONE_SEARCH_PLACEHOLDER'),
    note:
      org === null
        ? null
        : read === null
          ? t('PRO.CLONE_LOADING', { org: orgName })
          : !read.isListed
            ? t('PRO.CLONE_FAILED', { org: orgName })
            : all.length === 0
              ? t('PRO.CLONE_NONE', { org: orgName })
              : found.length === 0
                ? t('PRO.CLONE_EMPTY', { org: orgName })
                : null,
    projects: found.map((offer) => {
      const state = downloads[offer.projectId];
      const isWorking = state === 'working';
      const isHere = projects.some(({ id }) => id === offer.projectId);

      return {
        id: offer.projectId,
        name: offer.name,
        code: offer.key,
        meta:
          offer.plans.length === 1
            ? t('PRO.PLANS_ONE')
            : t('PRO.PLANS_OTHER', { count: offer.plans.length }),
        isHere,
        hereLabel: t('PRO.CLONE_HERE'),
        isWorking,
        label: isWorking ? t('PRO.CLONE_WORKING') : t('PRO.CLONE'),
        failure:
          state === undefined || state === 'working'
            ? null
            : t(PRO_DOWNLOAD_FAILURES[state]),
        onClone: () => {
          if (!isWorking && !isHere) void clone(offer);
        },
      };
    }),
    onQuery: setQuery,
    onCancel: onClose,
    onConfirm: onClose,
  };
};
