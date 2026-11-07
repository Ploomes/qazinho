import type { ITarget } from '@/modules/Project/types';
import type { TargetKind } from '@/shared/types';
import { webAddressOf } from '@/modules/Project/library';

const KINDS: TargetKind[] = ['web', 'android', 'ios'];

/**
 * Os alvos de um projeto novo pelo que um agente deu (um endereço web, um .apk, um .app),
 * ou por que não dá para criá-lo.
 */
export function projectTargetsOf(props: {
  values: { web?: string; android?: string; ios?: string };
  labelOf: (kind: TargetKind) => string;
}): { isOk: true; targets: ITarget[] } | { isOk: false; text: string } {
  const { values, labelOf } = props;
  const web = filled(values.web);
  const address = web === null ? null : webAddressOf(web);

  if (web !== null && address === null)
    return { isOk: false, text: `"${web}" is not a web address.` };

  const chosen: Record<TargetKind, string | null> = {
    web: address,
    android: filled(values.android),
    ios: filled(values.ios),
  };
  const targets = KINDS.flatMap((kind): ITarget[] => {
    const value = chosen[kind];

    return value === null ? [] : [{ id: `t-${kind}`, kind, label: labelOf(kind), value }];
  });

  if (targets.length === 0)
    return {
      isOk: false,
      text: 'A project needs at least one target: a web address, an Android .apk or an iOS simulator .app.',
    };

  return { isOk: true, targets };
}

function filled(value: string | undefined): string | null {
  return value === undefined || value === '' ? null : value;
}
