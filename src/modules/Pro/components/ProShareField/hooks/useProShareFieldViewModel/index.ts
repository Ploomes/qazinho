import type { IProShareFieldProps } from '@/modules/Pro/components/ProShareField/types';
import type { IProOrg } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PRO_ROLES, PRO_SITE_URL } from '@/modules/Pro/components/ProCard/constants';
import { PRO_SYNC_STATES } from '@/modules/Pro/constants';
import { formatSyncedAt } from '@/modules/Pro/library';
import { Pro } from '@/services';
import { useAppStore, useProStore, useSettingsStore } from '@/store';

export const useProShareFieldViewModel = (props: IProShareFieldProps) => {
  const { projectId } = props;
  const isSaved = projectId !== null;
  const { t, i18n } = useTranslation();
  const status = useProStore((state) => state.status);
  const share = useProStore(
    (state) => state.shares.find((one) => one.projectId === projectId) ?? null,
  );
  const landShare = useProStore((state) => state.landShare);
  const closeModal = useAppStore((state) => state.closeModal);
  const openSettings = useAppStore((state) => state.openSettings);
  const selectTab = useSettingsStore((state) => state.selectTab);
  const [isSaving, setSaving] = useState(false);

  const signedIn = status?.isSignedIn === true ? status : null;
  const orgSlug = share?.orgSlug ?? null;

  const choose = async (slug: string | null) => {
    if (projectId === null || isSaving || slug === orgSlug) return;

    setSaving(true);
    landShare(await Pro.share({ projectId, orgSlug: slug }));
    setSaving(false);
  };

  const whyNotOf = (org: IProOrg) =>
    org.role === 'reader'
      ? t('PRO.SHARE_READER')
      : org.billingStatus === 'blocked' || org.billingStatus === 'canceled'
        ? t('PRO.SHARE_ORG_BLOCKED')
        : null;

  const choiceOf = (props: {
    slug: string | null;
    name: string;
    note: string;
    whyNot: string | null;
  }) => {
    const isOn = props.slug === orgSlug;
    const isDisabled = props.whyNot !== null && !isOn;

    return {
      key: props.slug ?? '',
      name: props.name,
      note: props.whyNot ?? props.note,
      isOn,
      isDisabled,
      className: [
        'pro-share__choice',
        isOn ? 'pro-share__choice--on' : '',
        isDisabled ? 'pro-share__choice--off' : '',
      ]
        .filter(Boolean)
        .join(' '),
      onClick: () => {
        if (!isDisabled) void choose(props.slug);
      },
    };
  };

  const shown = share === null ? null : PRO_SYNC_STATES[share.state];

  return {
    isUnsaved: !isSaved,
    isLoading: isSaved && status === null,
    isSignedOut: isSaved && status?.isSignedIn === false,
    hasNoOrgs: isSaved && signedIn !== null && signedIn.orgs.length === 0,
    hasOrgs: isSaved && signedIn !== null && signedIn.orgs.length > 0,
    choices: [
      choiceOf({
        slug: null,
        name: t('PRO.SHARE_NONE'),
        note: t('PRO.SHARE_NONE_NOTE'),
        whyNot: null,
      }),
      ...(signedIn?.orgs ?? []).map((org) =>
        choiceOf({
          slug: org.slug,
          name: org.name,
          note: t(PRO_ROLES[org.role]),
          whyNot: whyNotOf(org),
        }),
      ),
    ],
    state:
      share === null || shown === null
        ? null
        : {
            icon: shown.icon,
            label: t(shown.labelKey),
            when:
              share.state === 'synced' && share.syncedAt !== null
                ? formatSyncedAt({ at: share.syncedAt, language: i18n.language })
                : null,
            className: `pro-share__state pro-share__state--${shown.tone}`,
          },
    isSaving,
    siteUrl: PRO_SITE_URL,
    onOpenPro: () => {
      closeModal();
      selectTab('pro');
      openSettings();
    },
  };
};
