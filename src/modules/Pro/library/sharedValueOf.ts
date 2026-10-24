/** What a target is, as an org may read it: a web address without a login in it, or a build by its file name, never the folder it sits in on this machine. */
export function sharedValueOf(value: string): string {
  if (!/^https?:\/\//i.test(value)) return value.split(/[\\/]/).pop() ?? value;

  try {
    const url = new URL(value);

    if (url.username === '' && url.password === '') return value;

    url.username = '';
    url.password = '';

    return url.toString();
  } catch {
    return value;
  }
}
