// Configuração local; nunca imprime nem coloca credenciais no projeto.
import { readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

const credentialsPath = join(homedir(), '.omniroute', 'codex-local.json');
let credentials;
try { credentials = JSON.parse(await readFile(credentialsPath, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
let cookie = '';
async function request(path, method = 'GET', body) {
  const response = await fetch(`http://127.0.0.1:20128${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) },
    body: body && JSON.stringify(body), signal: AbortSignal.timeout(30000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}: ${JSON.stringify(data.error)}`);
  const session = response.headers.getSetCookie();
  if (session.length) cookie = session.map(value => value.split(';')[0]).join('; ');
  return data;
}
await request('/api/auth/login', 'POST', { password: credentials?.password || 'CHANGEME' });
if (!credentials) {
  credentials = { password: randomBytes(24).toString('base64url') };
  await writeFile(credentialsPath, JSON.stringify(credentials), { flag: 'wx', mode: 0o600 });
  await request('/api/settings', 'PATCH', { currentPassword: 'CHANGEME', newPassword: credentials.password });
}
await request('/api/settings', 'PATCH', { hidePaidModels: true, cloudEnabled: false });
if (!credentials.apiKey) {
  const key = await request('/api/keys', 'POST', {
    name: 'Codex gratuito local', modelAccessMode: 'restricted',
    allowedModels: ['auto/coding:free'], noLog: true,
  });
  credentials.apiKey = key.key;
  credentials.keyId = key.id;
  await writeFile(credentialsPath, JSON.stringify(credentials), { mode: 0o600 });
}
const models = await fetch('http://127.0.0.1:20128/v1/models', {
  headers: { Authorization: `Bearer ${credentials.apiKey}` }, signal: AbortSignal.timeout(30000),
});
const catalog = await models.json();
console.log(JSON.stringify({ status: models.status, freeRouteAvailable: catalog.data?.some(model => model.id === 'auto/coding:free'), error: catalog.error }, null, 2));
