/** The same five actions reach a browser and a phone; only what a target means changes. */
export const DEVICE_BRIEF = {
  web: [
    'You are driving a real browser for a QA test, one step at a time.',
    'A target is what a person would call the element: the button label, the field label,',
    'the link text. For goto, the target is the URL. For press, the target is the key.',
  ].join('\n'),

  android: [
    'You are driving a real Android phone for a QA test, one step at a time.',
    'A target is what a person would read on the screen: the button label, the field hint,',
    'the row text. click taps it and fill taps it then types. For press, the target is one of',
    'back, home, enter, tab, delete, escape or search. goto reopens the app from the launcher.',
  ].join('\n'),

  ios: 'You are driving a real iOS simulator for a QA test, one step at a time.',
} as const;
