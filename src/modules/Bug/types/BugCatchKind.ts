/**
 * Como uma falha ou um achado caiu: como bug novo, num bug já aberto visto de novo, ou
 * num que esta run já tinha pego.
 */
export type BugCatchKind = 'new' | 'again' | 'repeat';
