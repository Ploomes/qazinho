export const PRO_LINK = {
  scheme: 'qazinho',
  action: 'open',
  orgSlug: /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/,
  id: /^[\w-]{1,128}$/,
} as const;
