const SECRET_PARTS = new Set([
  'PASSWORD',
  'PASS',
  'PASSWD',
  'PWD',
  'SECRET',
  'TOKEN',
  'KEY',
  'APIKEY',
  'PIN',
  'OTP',
  'CODE',
  'CREDENTIAL',
  'CREDENTIALS',
  'AUTH',
  'PRIVATE',
  'COOKIE',
  'SESSION',
  'BYPASS',
  'SENHA',
  'CHAVE',
]);

const PLAIN_PARTS = new Set([
  'EMAIL',
  'MAIL',
  'USER',
  'USERNAME',
  'LOGIN',
  'URL',
  'HOST',
  'DOMAIN',
  'PHONE',
  'NAME',
  'ACCOUNT',
  'USUARIO',
  'NOME',
]);

/**
 * Se uma variável nasce como segredo pelo nome dela: um e-mail ou um usuário não, e tudo
 * que nomeia uma senha, um token ou uma chave, ou nada que se conheça, sim.
 */
export function isSecretName(name: string): boolean {
  const parts = name.toUpperCase().split(/[^A-Z0-9]+/);

  if (parts.some((part) => SECRET_PARTS.has(part))) return true;

  return !parts.some((part) => PLAIN_PARTS.has(part));
}
