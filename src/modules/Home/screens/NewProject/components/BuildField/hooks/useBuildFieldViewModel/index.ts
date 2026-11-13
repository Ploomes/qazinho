import type { IBuildFieldProps } from '@/modules/Home/screens/NewProject/components/BuildField/types';
import type { IProjectBuild } from '@/modules/Home/types';
import { useTranslation } from 'react-i18next';
import { TARGET_NAME_KEYS } from '@/modules/Project/components/ProjectModal/constants';
import { Files, Platform } from '@/services';

export const useBuildFieldViewModel = (props: IBuildFieldProps) => {
  const { value, onChange } = props;
  const { t } = useTranslation();
  const pick = async (kind: IProjectBuild['kind']) => {
    const path = await Files.pick(kind === 'android' ? 'apk' : 'app');

    if (path === null) return;

    onChange([...value.filter((build) => build.kind !== kind), { kind, path }]);
  };

  return {
    label: t('NEW_PROJECT.BUILD_LABEL'),
    apkLabel: t('NEW_PROJECT.BUILD_APK'),
    appLabel: t('NEW_PROJECT.BUILD_APP'),
    canPickApp: Platform.isMac(),
    statusText:
      value.length === 0
        ? t('NEW_PROJECT.BUILD_HINT')
        : value
            .map(({ kind, path }) =>
              t('NEW_PROJECT.BUILD_OK', {
                platform: t(TARGET_NAME_KEYS[kind]),
                file: path.split(/[\\/]/).at(-1) ?? path,
              }),
            )
            .join('  ·  '),
    statusClassName:
      value.length === 0
        ? 'field-card__status'
        : 'field-card__status field-card__status--ok',
    onPickApk: () => {
      void pick('android');
    },
    onPickApp: () => {
      void pick('ios');
    },
  };
};
