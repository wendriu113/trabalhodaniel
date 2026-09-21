import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const { apiKey } = JSON.parse(await readFile(join(homedir(), '.omniroute', 'codex-local.json'), 'utf8'));
const response = await fetch('http://127.0.0.1:20128/v1/responses', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
  body: JSON.stringify({ model: 'auto/coding:free', input: 'Responda apenas OK.', max_output_tokens: 32, stream: false }),
  signal: AbortSignal.timeout(120000),
});
const text = await response.text();
console.log('HTTP', response.status, text.slice(0,2500));
if (!response.ok) process.exitCode = 1;
