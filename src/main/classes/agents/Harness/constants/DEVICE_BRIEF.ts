import type { TargetKind } from '@/shared/types';

export const DEVICE_BRIEF: Record<TargetKind, string[]> = {
  web: [
    'The device is a real Chrome browser.',
    'Name a control the way a person reads it: the button label, the field label, the link text.',
    'For goto, the target is the URL. For press, the target is the key.',
  ],
  android: [
    'The device is a real Android phone.',
    'Name a control the way a person reads it on the screen: the button label, the field hint, the row text.',
    'click taps it, fill taps it then types. For press, the target is one of back, home, enter, tab,',
    'delete, escape or search. goto reopens the app from the launcher.',
  ],
  ios: ['The device is a real iOS simulator.'],
};
