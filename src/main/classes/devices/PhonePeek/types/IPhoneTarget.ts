/** A phone app to look at: an Android .apk or an iOS simulator .app, by its path. */
export interface IPhoneTarget {
  kind: 'android' | 'ios';
  value: string;
}
