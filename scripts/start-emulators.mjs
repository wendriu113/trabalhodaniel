import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const firebase = 'node_modules/firebase-tools/lib/bin/firebase.js';
const args = [firebase, 'emulators:start', '--project', 'demo-sgo', '--only', 'auth,firestore,storage,functions'];

if (existsSync('.firebase-data/firebase-export-metadata.json')) {
  args.push('--import=.firebase-data');
}
args.push('--export-on-exit=.firebase-data');

const child = spawn(process.execPath, args, { stdio: 'inherit', windowsHide: true });
child.on('exit', code => { process.exitCode = code ?? 1; });
