import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve('.cache/e2e-dist');
const build = spawn(process.execPath, ['node_modules/expo/bin/cli', 'export', '--clear', '--platform', 'web', '--output-dir', root], {
  stdio: 'inherit', env: { ...process.env, EXPO_NO_DOTENV: '1', EXPO_OFFLINE: '1', EXPO_PUBLIC_USE_EMULATORS: 'true', EXPO_PUBLIC_EMULATOR_HOST: '127.0.0.1' }, windowsHide: true,
});
const code = await new Promise(resolve => build.once('exit', resolve));
if (code !== 0) process.exit(code || 1);
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.json': 'application/json' };
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, pathname === '/' ? 'index.html' : '.' + pathname);
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch {
    if (!extname(new URL(req.url, 'http://localhost').pathname)) {
      res.setHeader('Content-Type', 'text/html'); res.end(await readFile(resolve(root, 'index.html')));
    } else res.writeHead(404).end('Not found');
  }
}).listen(4173, '127.0.0.1');
