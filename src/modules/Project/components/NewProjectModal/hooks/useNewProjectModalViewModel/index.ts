import type { ITarget } from '@/modules/Project/types';
import { useState } from 'react';
import { MACHINE } from '@/modules/Project/constants';
import { Platform } from '@/services';
import { useAppStore } from '@/store';

export const useNewProjectModalViewModel = () => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [apk, setApk] = useState('');
  const [app, setApp] = useState('');

  const addProject = useAppStore((state) => state.addProject);
  const closeModal = useAppStore((state) => state.closeModal);

  const isMac = Platform.isMac();
  const hasTarget = [url, apk, app].some((value) => value.trim().length > 0);

  const onCreate = () => {
    if (name.trim().length === 0 || !hasTarget) return;

    const targets: ITarget[] = [];

    if (url.trim().length > 0)
      targets.push({ id: 't-web', kind: 'web', label: 'Web', value: url });
    if (apk.trim().length > 0)
      targets.push({
        id: 't-android',
        kind: 'android',
        label: 'Android · Pixel 7',
        value: apk,
      });
    if (app.trim().length > 0)
      targets.push({ id: 't-ios', kind: 'ios', label: 'iOS · iPhone 16', value: app });

    addProject({ id: `p-${String(Date.now())}`, name: name.trim(), targets });
  };

  return {
    name,
    url,
    apk,
    app,
    isMac,
    canCreate: name.trim().length > 0 && hasTarget,
    androidNote: MACHINE.androidSdk.note,
    xcodeNote: isMac ? MACHINE.xcode.note : 'macOS only',
    isIosAvailable: isMac && MACHINE.xcode.isFound,
    footerHint: isMac
      ? 'iOS needs Xcode · Android SDK found · nothing is downloaded for you'
      : 'iOS needs macOS · Android SDK found · nothing is downloaded for you',
    onNameChange: setName,
    onUrlChange: setUrl,
    onApkChange: setApk,
    onAppChange: setApp,
    onCancel: closeModal,
    onCreate,
  };
};
