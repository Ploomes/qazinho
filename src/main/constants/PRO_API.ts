export const PRO_API = {
  url: process.env.QAZINHO_API_URL ?? 'https://api.qazinho.com',
  web: process.env.QAZINHO_WEB_URL ?? 'https://app.qazinho.com',
} as const;
