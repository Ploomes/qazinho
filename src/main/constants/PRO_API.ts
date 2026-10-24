export const PRO_API = {
  url: process.env.QAZINHO_API_URL ?? 'https://api.qazinho.salvesoftware.com',
  web: process.env.QAZINHO_WEB_URL ?? 'https://qazinho.salvesoftware.com',
} as const;
