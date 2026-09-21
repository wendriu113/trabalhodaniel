export function errorMessage(error: unknown): string {
  if (typeof __DEV__ !== 'undefined' && __DEV__) console.error('[SGO] Firebase operation failed', error);
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Login ou senha incorretos. Confira os dados informados.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado. Entre na sua conta.',
    'auth/weak-password': 'Escolha uma senha com pelo menos 6 caracteres.',
    'auth/invalid-email': 'Informe um e-mail válido.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    'auth/network-request-failed': 'Não foi possível conectar. Confira sua internet e tente novamente.',
    'auth/operation-not-allowed': 'Ative o login por e-mail e senha no console do Firebase.',
    'auth/configuration-not-found': 'Ative o Authentication e o login por e-mail/senha no console do projeto Firebase.',
    'permission-denied': 'Sua conta não tem permissão para esta operação. Entre novamente; se continuar, peça ao administrador para conferir a liberação e as regras publicadas.',
    'functions/unavailable': 'O serviço da oficina está indisponível. Tente novamente mais tarde.',
    'functions/not-found': 'Registro ou serviço não encontrado. Confira a publicação das funções da oficina.',
    'functions/unauthenticated': 'Sua sessão expirou. Saia e entre novamente.',
    'auth/user-disabled': 'Este acesso ainda não foi liberado. Consulte a oficina.',
    'unavailable': 'O banco está indisponível. Confira sua conexão e tente novamente.',
    'storage/unauthorized': 'Sem permissão para este arquivo. Confira as regras de armazenamento.',
    'storage/retry-limit-exceeded': 'O envio demorou demais. Confira a conexão e tente novamente.',
    'storage/quota-exceeded': 'O armazenamento atingiu sua cota. Verifique o projeto Firebase.',
  };
  if (code && ['functions/invalid-argument', 'functions/already-exists', 'functions/failed-precondition', 'functions/permission-denied'].includes(code) && error instanceof Error) return error.message;
  return code ? messages[code] ?? `Não foi possível concluir (${code}). Tente novamente.` : error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.';
}
