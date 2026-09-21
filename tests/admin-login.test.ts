import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

// Execute após npm run seed:admin, com os emuladores locais ligados.
test('admin local autentica com a senha configurada e recebe a claim administrativa', async () => {
  const app = initializeApp({ projectId: 'demo-sgo', apiKey: 'demo-sgo-key' }, 'admin-login-test');
  try {
    const auth = getAuth(app);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    const { user } = await signInWithEmailAndPassword(auth, 'adm@adm.com', 'Adm123');
    assert.equal((await user.getIdTokenResult()).claims.admin, true);
    await signOut(auth);
    await assert.rejects(signInWithEmailAndPassword(auth, 'adm@adm.com', 'senha-incorreta'));
  } finally {
    await deleteApp(app);
  }
});
