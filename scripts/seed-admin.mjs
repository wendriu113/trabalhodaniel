// Trusted workstation only. Never import this module in the Expo application.
import { createRequire } from 'node:module';

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

try { process.loadEnvFile(); } catch (error) { if (error.code !== 'ENOENT') throw error; }

const [projectIdArg, emailArg, passwordArg] = process.argv.slice(2);
const local = process.env.EXPO_PUBLIC_USE_EMULATORS === 'true';
const projectId = projectIdArg || process.env.FIREBASE_PROJECT_ID || (local ? 'demo-sgo' : process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);
if (local && !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = `${process.env.EXPO_PUBLIC_EMULATOR_HOST || '127.0.0.1'}:9099`;
}
const isEmulator = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);
if (!projectId) throw new Error('Informe o projeto Firebase.');
if (isEmulator && projectId !== 'demo-sgo') throw new Error('Emulador permitido somente para demo-sgo.');
if (!isEmulator && projectId.startsWith('demo-')) throw new Error('Inicie os emuladores antes de criar o admin local.');
const email = emailArg || 'adm@adm.com';
const password = passwordArg || process.env.ADMIN_PASSWORD || (isEmulator ? 'Adm123' : undefined);
if (!password) throw new Error('Informe ADMIN_PASSWORD para configurar o admin no Firebase real.');

initializeApp({ projectId, ...(isEmulator ? {} : { credential: applicationDefault() }) });

const auth = getAuth();

let user;
try {
  user = await auth.getUserByEmail(email);
  await auth.updateUser(user.uid, { password, emailVerified: true, disabled: false });
  console.log(`Atualizei a conta ${email}.`);
} catch (error) {
  if ((error).code !== 'auth/user-not-found') throw error;
  user = await auth.createUser({ email, password, emailVerified: true, disabled: false });
  console.log(`Criei a conta ${email}.`);
}

await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true });

console.log({
  projectId,
  uid: user.uid,
  email: user.email,
  admin: true,
  emulator: isEmulator,
});
console.log('Entre no app com esse e-mail e senha. Depois, saia e entre de novo se já estava logado.');
