export const PRO_API = {
  url: process.env.QAZINHO_API_URL ?? 'https://qazinho-api.salvesoftware.com',
  web: process.env.QAZINHO_WEB_URL ?? 'https://qazinho.salvesoftware.com',
} as const;
