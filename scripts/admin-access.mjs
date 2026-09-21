// Trusted workstation only. Never import this module in the Expo application.
import { createRequire } from 'node:module';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const [projectId, uid, flag] = process.argv.slice(2);
if (!projectId || !uid) throw new Error('Uso: node scripts/admin-access.mjs PROJECT_ID UID [--apply]');
if (process.env.FIREBASE_AUTH_EMULATOR_HOST && projectId !== 'demo-sgo') throw new Error('Emulador permitido somente para demo-sgo.');
initializeApp({ projectId, ...(process.env.FIREBASE_AUTH_EMULATOR_HOST ? {} : { credential: applicationDefault() }) });
const auth = getAuth(), user = await auth.getUser(uid);
console.log({ projectId, uid: user.uid, email: user.email, wasAdmin: user.customClaims?.admin === true, apply: flag === '--apply' });
if (flag === '--apply') {
  await auth.setCustomUserClaims(uid, { ...user.customClaims, admin: true });
  console.log('Administrador autorizado. Saia e entre novamente no aplicativo.');
} else console.log('Simulação: nenhuma alteração. Revise a conta e execute com --apply.');
process.env.EXPO_PUBLIC_USE_EMULATORS=true
