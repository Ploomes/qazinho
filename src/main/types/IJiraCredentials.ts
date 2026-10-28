/**
 * O site do Jira e o que faz o QAzinho entrar nele, aberto na main para chamar o Jira;
 * nunca sai da main.
 */
export interface IJiraCredentials {
  site: string;
  email: string;
  token: string;
}
